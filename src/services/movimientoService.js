import mongoose from 'mongoose';
import { Movimiento, TIPOS_MOVIMIENTO } from '../models/Movimiento.js';
import { Elemento } from '../models/Elemento.js';
import { buscarPersonalActivo } from './personalService.js';

// CREATE: registra una Salida o una Entrada de uno o varios elementos.
// Recibe los _id de los elementos (elementos_ids) y arma la copia embebida
// (tipo_elemento, subtipo, interno) con lo que hay en la colección elementos.
// El movimiento y el cambio de asignado_a se guardan en una transacción:
// se aplican las dos cosas o ninguna.
export async function crearMovimiento(datos) {
  const {
    fecha,
    hora,
    tipo_movimiento,
    asignado,
    supervisor,
    elementos_ids,
    observaciones,
  } = datos;

  if (!TIPOS_MOVIMIENTO.includes(tipo_movimiento)) {
    throw new Error(
      `tipo_movimiento debe ser uno de: ${TIPOS_MOVIMIENTO.join(', ')}`,
    );
  }
  if (!Array.isArray(elementos_ids) || elementos_ids.length === 0) {
    throw new Error('Un movimiento debe incluir al menos un elemento');
  }
  for (const id of elementos_ids) {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error(`"${id}" no es un _id de elemento válido`);
    }
  }
  const ids = elementos_ids.map(String);
  if (new Set(ids).size !== ids.length) {
    throw new Error('No se puede repetir un elemento en el mismo movimiento');
  }

  await buscarPersonalActivo(asignado);
  await buscarPersonalActivo(supervisor);

  const esSalida = tipo_movimiento === 'Salida';
  const session = await mongoose.startSession();
  try {
    let movimiento;
    await session.withTransaction(async () => {
      const elementos = await Elemento.find({
        _id: { $in: ids },
        isEliminado: false,
      }).session(session);
      if (elementos.length !== ids.length) {
        throw new Error('Algún elemento no existe o está dado de baja');
      }

      // Reglas de negocio
      for (const elemento of elementos) {
        if (esSalida) {
          if (elemento.estado !== 'operativo') {
            throw new Error(
              `El elemento ${elemento.interno} no está operativo (${elemento.estado}): no puede salir`,
            );
          }
          if (elemento.asignado_a) {
            throw new Error(
              `El elemento ${elemento.interno} ya está asignado: primero hay que registrar su devolución`,
            );
          }
        } else if (String(elemento.asignado_a) !== String(asignado)) {
          throw new Error(
            `El elemento ${elemento.interno} no está asignado a ese personal`,
          );
        }
      }

      // Copia embebida de cada elemento, en el orden en que llegaron los _id
      const porId = new Map(elementos.map((e) => [String(e._id), e]));
      const items = ids.map((id) => {
        const e = porId.get(id);
        const item = {
          elemento_id: e._id,
          tipo_elemento: e.tipo_elemento,
          interno: e.interno,
        };
        if (e.tipo_elemento === 'Móvil') {
          item.subtipo = e.subtipo;
        }
        return item;
      });

      const [creado] = await Movimiento.create(
        [
          {
            fecha,
            hora,
            tipo_movimiento,
            asignado,
            supervisor,
            elementos: items,
            observaciones,
          },
        ],
        { session },
      );
      movimiento = creado;

      // Salida: los elementos pasan a estar asignados. Entrada: vuelven a base.
      // El filtro repite las condiciones para que el cambio sea atómico.
      const resultado = await Elemento.updateMany(
        {
          _id: { $in: ids },
          isEliminado: false,
          asignado_a: esSalida ? null : asignado,
          ...(esSalida && { estado: 'operativo' }),
        },
        { $set: { asignado_a: esSalida ? asignado : null } },
        { session },
      );
      if (resultado.modifiedCount !== ids.length) {
        throw new Error(
          'Algún elemento cambió mientras se procesaba el movimiento; volver a intentar',
        );
      }
    });
    return movimiento;
  } finally {
    await session.endSession();
  }
}

// READ: lista los movimientos activos, del más reciente al más antiguo.
// Nunca devuelve los que están dados de baja.
export async function listarMovimientos(filtro = {}) {
  return Movimiento.find({ ...filtro, isEliminado: false }).sort({
    fecha: -1,
    hora: -1,
  });
}

// UPDATE: solo se puede modificar observaciones. Fecha, hora, tipo, personal y
// elementos forman el registro histórico y, además, determinan el asignado_a
// de los elementos, así que no se tocan después de creado el movimiento.
export async function actualizarMovimiento(id, cambios) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`"${id}" no es un _id válido`);
  }
  const noPermitidos = Object.keys(cambios).filter(
    (campo) => campo !== 'observaciones',
  );
  if (noPermitidos.length > 0) {
    throw new Error(
      `No se puede modificar: ${noPermitidos.join(', ')}. Solo observaciones`,
    );
  }
  if (cambios.observaciones === undefined) {
    throw new Error('No hay nada para actualizar: indicar observaciones');
  }

  const actualizado = await Movimiento.findOneAndUpdate(
    { _id: id, isEliminado: false },
    { $set: { observaciones: cambios.observaciones } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!actualizado) {
    throw new Error('No existe un movimiento activo con ese _id');
  }
  return actualizado;
}

// DELETE (baja lógica): marca el movimiento como eliminado. Nunca usa deleteOne/deleteMany.
// No modifica el asignado_a de los elementos: es una anulación del registro.
export async function eliminarMovimiento(id, motivo) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`"${id}" no es un _id válido`);
  }
  if (!motivo || !motivo.trim()) {
    throw new Error('Hay que indicar el motivo de la baja');
  }

  const actualizado = await Movimiento.findOneAndUpdate(
    { _id: id, isEliminado: false },
    {
      $set: {
        isEliminado: true,
        fecha_eliminacion: new Date(),
        motivo_eliminacion: motivo.trim(),
      },
    },
    { returnDocument: 'after', runValidators: true },
  );
  if (!actualizado) {
    throw new Error('No existe un movimiento activo con ese _id');
  }
  return actualizado;
}

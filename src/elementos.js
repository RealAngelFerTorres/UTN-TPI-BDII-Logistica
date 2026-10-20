import mongoose from 'mongoose';
import { Elemento } from './models/Elemento.js';
import { Personal } from './models/Personal.js';

// CREATE: da de alta un HT o un móvil.
export async function crearElemento(datos) {
  if (datos.asignado_a) {
    const persona = await Personal.findOne({ _id: datos.asignado_a, isEliminado: false });
    if (!persona) {
      throw new Error('asignado_a no corresponde a ningún personal activo');
    }
  }

  try {
    return await Elemento.create(datos);
  } catch (error) {
    if (error.code === 11000) {
      throw new Error(`Ya existe un ${datos.tipo_elemento} activo con interno ${datos.interno}`);
    }
    throw error;
  }
}

// DELETE (baja lógica): marca el elemento como eliminado. Nunca usa deleteOne/deleteMany.
export async function eliminarElemento(id, motivo) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`"${id}" no es un _id válido`);
  }
  if (!motivo || !motivo.trim()) {
    throw new Error('Hay que indicar el motivo de la baja');
  }

  const elemento = await Elemento.findOne({ _id: id, isEliminado: false });
  if (!elemento) {
    throw new Error('No existe un elemento activo con ese _id');
  }
  if (elemento.asignado_a) {
    throw new Error(
      `El elemento ${elemento.interno} está asignado: primero hay que registrar su devolución`,
    );
  }

  // El filtro repite las condiciones para que la baja sea atómica
  // (si otro proceso lo asignó entre la consulta y la baja, no se aplica).
  const actualizado = await Elemento.findOneAndUpdate(
    { _id: id, isEliminado: false, asignado_a: null },
    {
      $set: {
        isEliminado: true,
        fecha_eliminacion: new Date(),
        motivo_eliminacion: motivo.trim(),
      },
    },
    { returnDocument: 'after' },
  );
  if (!actualizado) {
    throw new Error('El elemento cambió mientras se procesaba la baja; volver a intentar');
  }
  return actualizado;
}

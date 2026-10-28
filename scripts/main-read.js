import mongoose from 'mongoose';
import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { Movimiento } from '../src/models/Movimiento.js';
import '../src/models/Personal.js';

function titulo(texto) {
  console.log(`\n${'='.repeat(100)}`);
  console.log(texto);
  console.log('='.repeat(100));
}

function fechaHoraSalida(fecha, hora) {
  // La fecha del movimiento representa el día calendario.
  // La hora se interpreta en la zona horaria local.
  const [horas, minutos] = hora.split(':').map(Number);

  return new Date(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    horas,
    minutos,
  );
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha);
}

function tiempoTranscurrido(fecha) {
  const diferencia = Date.now() - fecha.getTime();

  if (diferencia < 0) {
    return 'Fecha futura: revisar datos';
  }

  const minutosTotales = Math.floor(diferencia / 60000);
  const dias = Math.floor(minutosTotales / 1440);
  const horas = Math.floor((minutosTotales % 1440) / 60);
  const minutos = minutosTotales % 60;

  if (dias > 0) {
    return `${dias} día(s), ${horas} h`;
  }

  if (horas > 0) {
    return `${horas} h, ${minutos} min`;
  }

  return `${minutos} min`;
}

async function main() {
  await conectar();

  titulo('READ: ELEMENTOS ACTIVOS');

  // 1. Obtener todos los elementos que no están dados de baja.
  const elementos = await Elemento.find({ isEliminado: false })
    .populate('asignado_a', 'lp jerarquia apellido nombre isEliminado')
    .sort({ tipo_elemento: 1, interno: 1 })
    .lean();

  // 2. Separar los elementos en base y los que están afuera.
  const enBase = elementos.filter((e) => e.asignado_a == null);
  const afuera = elementos.filter((e) => e.asignado_a != null);

  // 3. Buscar movimientos activos de los elementos que están afuera.
  const idsAfuera = afuera.map((e) => e._id);

  const movimientos = idsAfuera.length
    ? await Movimiento.find({
        isEliminado: false,
        'elementos.elemento_id': { $in: idsAfuera },
      })
        .sort({ fecha: -1, hora: -1 })
        .lean()
    : [];

  // Como están ordenados del más reciente al más antiguo,
  // conservamos el último movimiento encontrado para cada elemento.
  const ultimoMovimiento = new Map();

  for (const movimiento of movimientos) {
    for (const item of movimiento.elementos) {
      const id = String(item.elemento_id);

      if (
        idsAfuera.some((elementoId) => String(elementoId) === id) &&
        !ultimoMovimiento.has(id)
      ) {
        ultimoMovimiento.set(id, movimiento);
      }
    }
  }

  // 4. TABLA 1: elementos que están en base.
  titulo(`1. ELEMENTOS EN BASE (${enBase.length})`);

  if (enBase.length === 0) {
    console.log('No hay elementos activos en base.');
  } else {
    console.table(
      enBase.map((e) => ({
        Tipo: e.tipo_elemento,
        Interno: e.interno,
        Subtipo: e.subtipo ?? '-',
        Marca: e.marca,
        Modelo: e.modelo,
        Dominio: e.dominio ?? '-',
        Estado: e.estado,
        Asignacion: 'En base',
      })),
    );
  }

  // 5. TABLA 2: elementos asignados.
  titulo(`2. ELEMENTOS AFUERA (${afuera.length})`);

  if (afuera.length === 0) {
    console.log('No hay elementos asignados.');
  } else {
    console.table(
      afuera.map((e) => {
        const persona = e.asignado_a;
        const movimiento = ultimoMovimiento.get(String(e._id));

        // Solo tomamos la fecha si la última salida corresponde
        // a la persona que actualmente tiene el elemento.
        const salidaValida =
          movimiento &&
          movimiento.tipo_movimiento === 'Salida' &&
          String(movimiento.asignado) === String(persona._id);

        const salida = salidaValida
          ? fechaHoraSalida(movimiento.fecha, movimiento.hora)
          : null;

        return {
          Tipo: e.tipo_elemento,
          Interno: e.interno,
          Subtipo: e.subtipo ?? '-',
          Marca: e.marca,
          Modelo: e.modelo,
          Dominio: e.dominio ?? '-',
          Estado: e.estado,
          Personal: persona.isEliminado
            ? `${persona.apellido}, ${persona.nombre} (dado de baja)`
            : `${persona.apellido}, ${persona.nombre}`,
          LP: persona.lp,
          FechaSalida: salida ? formatearFecha(salida) : 'No disponible',
          TiempoAfuera: salida ? tiempoTranscurrido(salida) : 'No disponible',
        };
      }),
    );
  }

  // 6. Resumen general.
  titulo('3. RESUMEN');

  console.table([
    {
      Categoria: 'Elementos activos',
      Cantidad: elementos.length,
    },
    {
      Categoria: 'En base',
      Cantidad: enBase.length,
    },
    {
      Categoria: 'Afuera / asignados',
      Cantidad: afuera.length,
    },
    {
      Categoria: 'Total clasificado',
      Cantidad: enBase.length + afuera.length,
    },
  ]);

  // Comprobación de consistencia de la clasificación.
  if (enBase.length + afuera.length !== elementos.length) {
    throw new Error('La clasificación de elementos no coincide con el total.');
  }
}

try {
  await main();
} catch (error) {
  console.error('\nError en Main-read.js:', error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await desconectar();
  }
}

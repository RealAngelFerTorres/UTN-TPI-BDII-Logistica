import mongoose from 'mongoose';
import { conectar, desconectar } from '../src/db.js';
import { Movimiento } from '../src/models/Movimiento.js';
import '../src/models/Personal.js';

function titulo(texto) {
  console.log(`\n${'='.repeat(110)}`);
  console.log(texto);
  console.log('='.repeat(110));
}

function formatearFecha(fecha, hora) {
  const [horas, minutos] = hora.split(':').map(Number);

  const fechaLocal = new Date(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    horas,
    minutos,
  );

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fechaLocal);
}

async function main() {
  await conectar();

  titulo('READ: ULTIMOS 100 MOVIMIENTOS');

  // 1. Obtener los últimos 100 movimientos activos.
  const movimientos = await Movimiento.find({ isEliminado: false })
    .populate('asignado', 'lp jerarquia apellido nombre')
    .populate('supervisor', 'lp jerarquia apellido nombre')
    .sort({ fecha: -1, hora: -1, _id: -1 })
    .limit(100)
    .lean();

  // 2. Verificar si existen movimientos.
  if (movimientos.length === 0) {
    console.log('No hay movimientos registrados.');
    return;
  }

  // 3. Mostrar todos los movimientos en una única tabla.
  console.log(`Se encontraron ${movimientos.length} movimiento(s).`);

  console.table(
    movimientos.map((movimiento) => {
      const asignado = movimiento.asignado;
      const supervisor = movimiento.supervisor;

      return {
        Tipo: movimiento.tipo_movimiento,
        FechaHora: formatearFecha(movimiento.fecha, movimiento.hora),
        Elementos: movimiento.elementos
          .map((elemento) => {
            const subtipo = elemento.subtipo ? ` (${elemento.subtipo})` : '';

            return `${elemento.tipo_elemento}${subtipo} - ${elemento.interno}`;
          })
          .join('; '),
        Observaciones: movimiento.observaciones || '-',
        Asignado: asignado
          ? `${asignado.apellido}, ${asignado.nombre} | LP: ${asignado.lp}`
          : 'No disponible',
        Supervisor: supervisor
          ? `${supervisor.apellido}, ${supervisor.nombre} | LP: ${supervisor.lp}`
          : 'No disponible',
      };
    }),
  );

  // 4. Resumen.
  const entradas = movimientos.filter(
    (m) => m.tipo_movimiento === 'Entrada',
  ).length;

  const salidas = movimientos.filter(
    (m) => m.tipo_movimiento === 'Salida',
  ).length;

  titulo('RESUMEN DE LOS MOVIMIENTOS CONSULTADOS');

  console.table([
    {
      Categoria: 'Total de movimientos',
      Cantidad: movimientos.length,
    },
    {
      Categoria: 'Entradas',
      Cantidad: entradas,
    },
    {
      Categoria: 'Salidas',
      Cantidad: salidas,
    },
  ]);
}

try {
  await main();
} catch (error) {
  console.error('\nError en Main-read-ultimos.js:', error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await desconectar();
  }
}

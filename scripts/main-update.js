import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { Personal } from '../src/models/Personal.js';
import { Movimiento } from '../src/models/Movimiento.js';
import { crearMovimiento } from '../src/services/movimientoService.js';

// ==================================================
// CONFIGURACIÓN
// ==================================================

const OBSERVACION = 'Asignación inicial de prueba (UPDATE)';

const LP_SUPERVISOR = 9000004;

const movimientos = [
  {
    internos: ['HT900001'],
    lp: 9000001,
  },
  {
    internos: ['HT900002', 'HT900003'],
    lp: 9000002,
  },
  {
    internos: ['MV90001'],
    lp: 9000003,
  },
];

// ==================================================
// FUNCIONES GENERALES
// ==================================================

function titulo(texto) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(texto);
  console.log('='.repeat(60));
}

// ==================================================
// BÚSQUEDA DE PERSONAL POR LP
// ==================================================

async function buscarPersonalPorLP(lp) {
  const persona = await Personal.findOne({
    lp,
    isEliminado: false,
  });

  if (!persona) {
    throw new Error(`No se encontró personal activo con LP ${lp}.`);
  }

  return persona;
}

// ==================================================
// BÚSQUEDA DE ELEMENTOS POR INTERNO
// ==================================================

async function buscarElementoPorInterno(interno) {
  const elemento = await Elemento.findOne({
    interno,
    isEliminado: false,
  });

  if (!elemento) {
    throw new Error(
      `No se encontró un elemento activo con interno ${interno}.`,
    );
  }

  return elemento;
}

// ==================================================
// REGISTRO DE MOVIMIENTOS DE SALIDA
// ==================================================

async function registrarMovimientos() {
  const resultados = {
    creados: 0,
    fallidos: 0,
    omitidos: 0,
  };

  const supervisor = await buscarPersonalPorLP(LP_SUPERVISOR);

  console.log(
    `Supervisor: LP ${supervisor.lp} - ` +
      `${supervisor.apellido}, ${supervisor.nombre}`,
  );

  for (const datos of movimientos) {
    try {
      const persona = await buscarPersonalPorLP(datos.lp);

      const elementosEncontrados = [];

      for (const interno of datos.internos) {
        const elemento = await buscarElementoPorInterno(interno);
        elementosEncontrados.push(elemento);
      }

      // Evitar duplicar el movimiento de prueba.
      const idsElementos = elementosEncontrados.map((elemento) => elemento._id);

      const movimientoExistente = await Movimiento.findOne({
        tipo_movimiento: 'Salida',
        observaciones: OBSERVACION,
        asignado: persona._id,
        supervisor: supervisor._id,
        isEliminado: false,
        elementos: {
          $all: idsElementos.map((id) => ({
            $elemMatch: { elemento_id: id },
          })),
        },
      });

      if (movimientoExistente) {
        resultados.omitidos++;

        console.log(
          `OMITIDO | ${datos.internos.join(', ')} | ` +
            'Ya existe un movimiento de prueba.',
        );

        continue;
      }

      const ahora = new Date();

      const fecha = new Date(
        Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()),
      );

      const hora =
        `${String(ahora.getHours()).padStart(2, '0')}:` +
        `${String(ahora.getMinutes()).padStart(2, '0')}`;

      const movimiento = await crearMovimiento({
        fecha,
        hora,
        tipo_movimiento: 'Salida',
        asignado: persona._id,
        supervisor: supervisor._id,
        elementos_ids: idsElementos,
        observaciones: OBSERVACION,
      });

      resultados.creados++;

      console.log(
        `CREADO | Salida | ${datos.internos.join(', ')} | ` +
          `LP asignado: ${persona.lp} | ` +
          `LP supervisor: ${supervisor.lp} | ` +
          `Movimiento: ${movimiento._id}`,
      );
    } catch (error) {
      resultados.fallidos++;

      console.error(
        `ERROR | Elementos: ${datos.internos.join(', ')} | ` +
          `LP asignado: ${datos.lp}`,
      );

      console.error(`Motivo: ${error.message}`);
    }
  }

  return resultados;
}

// ==================================================
// VERIFICACIÓN DE ASIGNACIONES
// ==================================================

async function mostrarAsignaciones() {
  const internos = movimientos.flatMap((movimiento) => movimiento.internos);

  const elementos = await Elemento.find({
    interno: { $in: internos },
    isEliminado: false,
  })
    .populate('asignado_a', 'lp jerarquia apellido nombre')
    .sort({ interno: 1 })
    .lean();

  titulo('VERIFICACIÓN DE ASIGNACIONES');

  console.table(
    elementos.map((elemento) => ({
      Tipo: elemento.tipo_elemento,
      Interno: elemento.interno,
      Marca: elemento.marca,
      Modelo: elemento.modelo,
      Estado: elemento.estado,
      LP: elemento.asignado_a?.lp ?? '-',
      Jerarquía: elemento.asignado_a?.jerarquia ?? '-',
      Apellido: elemento.asignado_a?.apellido ?? 'En base',
      Nombre: elemento.asignado_a?.nombre ?? '-',
    })),
  );

  return elementos;
}

// ==================================================
// RESUMEN DE MOVIMIENTOS
// ==================================================

function mostrarResumen(resultados, elementosVerificados) {
  titulo('RESUMEN DEL UPDATE');

  console.log(`Movimientos solicitados: ${movimientos.length}`);
  console.log(`Movimientos creados: ${resultados.creados}`);
  console.log(`Movimientos omitidos: ${resultados.omitidos}`);
  console.log(`Movimientos fallidos: ${resultados.fallidos}`);
  console.log(
    `Elementos encontrados en la verificación: ${elementosVerificados.length}`,
  );

  const todosEncontrados = elementosVerificados.length === asignaciones.length;

  const sinFallos = resultados.fallidos === 0;

  if (!todosEncontrados || !sinFallos) {
    console.warn(
      'El proceso terminó con elementos faltantes o movimientos fallidos.',
    );

    process.exitCode = 1;
  } else {
    console.log('Proceso finalizado sin errores de registro.');
  }
}

// ==================================================
// FUNCIÓN PRINCIPAL
// ==================================================

async function main() {
  await conectar();

  titulo('UPDATE: ASIGNACIÓN DE ELEMENTOS');

  console.log('Se registrarán movimientos de tipo Salida.');

  const resultados = await registrarMovimientos();

  const elementosVerificados = await mostrarAsignaciones();

  mostrarResumen(resultados, elementosVerificados);
}

// ==================================================
// EJECUCIÓN Y CIERRE DE CONEXIÓN
// ==================================================

try {
  await main();
} catch (error) {
  console.error('Error en Main-update.js:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

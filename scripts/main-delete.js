import assert from 'node:assert/strict';

import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { Personal } from '../src/models/Personal.js';
import { Movimiento } from '../src/models/Movimiento.js';

import { crearMovimiento } from '../src/services/movimientoService.js';
import { eliminarElemento } from '../src/services/elementoService.js';

const OBSERVACION_ENTRADA = 'Devolución a base (DELETE de prueba)';
const MOTIVO_BAJA = 'Prueba de integración DELETE';

const LP_AGENTE = 9000002;
const LP_SUPERVISOR = 9000004;

function ok(mensaje) {
  console.log(`✓ ${mensaje}`);
}

function mismoConjunto(idsA, idsB) {
  const a = idsA.map(String).sort();
  const b = idsB.map(String).sort();

  return a.length === b.length && a.every((id, indice) => id === b[indice]);
}

async function registrarEntradaBase() {
  const agente = await Personal.findOne({
    lp: LP_AGENTE,
    isEliminado: false,
  });

  const supervisor = await Personal.findOne({
    lp: LP_SUPERVISOR,
    isEliminado: false,
  });

  assert.ok(agente, `No existe personal activo con LP ${LP_AGENTE}`);
  assert.ok(supervisor, `No existe personal activo con LP ${LP_SUPERVISOR}`);

  // Buscamos los elementos incluso si alguno fue dado de baja
  // en una ejecución anterior.
  const ht2 = await Elemento.findOne({
    tipo_elemento: 'HT',
    interno: 'HT900002',
  });

  const ht3 = await Elemento.findOne({
    tipo_elemento: 'HT',
    interno: 'HT900003',
  });

  assert.ok(ht2, 'No existe HT900002');
  assert.ok(ht3, 'No existe HT900003');

  const idsEsperados = [ht2._id, ht3._id];

  // Evitamos duplicar la Entrada si el script ya se ejecutó.
  const entradasAnteriores = await Movimiento.find({
    tipo_movimiento: 'Entrada',
    asignado: agente._id,
    supervisor: supervisor._id,
    observaciones: OBSERVACION_ENTRADA,
    isEliminado: false,
  });

  const entradaExistente = entradasAnteriores.find((movimiento) => {
    const idsMovimiento = movimiento.elementos.map((item) => item.elemento_id);

    return mismoConjunto(idsMovimiento, idsEsperados);
  });

  if (entradaExistente) {
    console.log('La Entrada conjunta ya existe; no se duplica.');
    ok('Entrada de HT900002 y HT900003 registrada anteriormente');
    return;
  }

  // Para registrar la Entrada, ambos HT deben estar activos
  // y asignados al mismo agente.
  assert.equal(
    ht2.isEliminado,
    false,
    'HT900002 ya está dado de baja y no puede participar en una nueva Entrada',
  );

  assert.equal(
    ht3.isEliminado,
    false,
    'HT900003 ya está dado de baja y no puede participar en una nueva Entrada',
  );

  assert.ok(
    ht2.asignado_a && ht3.asignado_a,
    'Ambos HT deben estar asignados antes de registrar la Entrada',
  );

  assert.equal(
    String(ht2.asignado_a),
    String(agente._id),
    'HT900002 no está asignado al agente esperado',
  );

  assert.equal(
    String(ht3.asignado_a),
    String(agente._id),
    'HT900003 no está asignado al agente esperado',
  );

  const ahora = new Date();

  const fecha = new Date(
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()),
  );

  const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(
    ahora.getMinutes(),
  ).padStart(2, '0')}`;

  const entrada = await crearMovimiento({
    fecha,
    hora,
    tipo_movimiento: 'Entrada',
    asignado: agente._id,
    supervisor: supervisor._id,
    elementos_ids: idsEsperados,
    observaciones: OBSERVACION_ENTRADA,
  });

  assert.equal(entrada.tipo_movimiento, 'Entrada');
  assert.equal(entrada.elementos.length, 2);

  ok('Entrada conjunta registrada para HT900002 y HT900003');
}

async function bajaLogicaDeUnElementoLibre() {
  const ht = await Elemento.findOne({
    tipo_elemento: 'HT',
    interno: 'HT900002',
  });

  assert.ok(ht, 'No existe HT900002');

  if (ht.isEliminado) {
    assert.ok(ht.fecha_eliminacion instanceof Date);
    assert.ok(ht.motivo_eliminacion);

    ok('HT900002 ya estaba dado de baja lógicamente');
    return;
  }

  assert.equal(
    ht.asignado_a,
    null,
    'HT900002 debe estar libre antes de intentar eliminarlo',
  );

  const baja = await eliminarElemento(ht._id, MOTIVO_BAJA);

  assert.equal(baja.isEliminado, true);
  assert.ok(baja.fecha_eliminacion instanceof Date);
  assert.equal(baja.motivo_eliminacion, MOTIVO_BAJA);

  // Comprobamos que no hubo borrado físico.
  const documentoEnBase = await Elemento.findById(ht._id);

  assert.ok(documentoEnBase, 'El elemento debería seguir en MongoDB');
  assert.equal(documentoEnBase.isEliminado, true);

  ok('DELETE lógico exitoso: HT900002 sigue en MongoDB y está dado de baja');
}

async function comprobarBajaRechazadaDeElementoAsignado() {
  const ht = await Elemento.findOne({
    tipo_elemento: 'HT',
    interno: 'HT900001',
  }).populate('asignado_a');

  assert.ok(ht, 'No existe HT900001');

  assert.equal(
    ht.isEliminado,
    false,
    'HT900001 ya está dado de baja; no se puede realizar esta prueba',
  );

  assert.ok(
    ht.asignado_a,
    'HT900001 debe continuar asignado para probar el rechazo',
  );

  assert.equal(
    ht.asignado_a.lp,
    9000001,
    'HT900001 debería seguir asignado a LP 9000001',
  );

  await assert.rejects(
    () => eliminarElemento(ht._id, MOTIVO_BAJA),
    (error) => {
      assert.match(
        error.message,
        /asignad|asignaci[oó]n/i,
        'El rechazo debería explicar que el elemento está asignado',
      );

      return true;
    },
  );

  // Verificamos que el intento rechazado no haya modificado el elemento.
  const sigueEnBase = await Elemento.findById(ht._id).populate('asignado_a');

  assert.ok(sigueEnBase);
  assert.equal(sigueEnBase.isEliminado, false);
  assert.ok(sigueEnBase.asignado_a);
  assert.equal(sigueEnBase.asignado_a.lp, 9000001);

  ok('DELETE rechazado: HT900001 sigue asignado y permanece activo');
}

async function main() {
  try {
    await conectar();

    console.log('\n========== DELETE: PRUEBAS DE INTEGRACIÓN ==========\n');

    // 1. Devolver dos HT juntos en un único movimiento de Entrada.
    await registrarEntradaBase();

    // 2. Dar de baja un elemento libre.
    await bajaLogicaDeUnElementoLibre();

    // 3. Intentar dar de baja un elemento todavía asignado.
    await comprobarBajaRechazadaDeElementoAsignado();

    console.log('\nTodas las pruebas DELETE finalizaron correctamente.');
  } finally {
    await desconectar();
  }
}

main().catch((error) => {
  console.error('\nError en Main-delete.js:', error.message);
  process.exitCode = 1;
});

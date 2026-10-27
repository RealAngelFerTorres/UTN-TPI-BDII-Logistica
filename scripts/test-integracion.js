// Prueba los servicios contra Atlas, en una base aparte (logistica_pruebas)
// para no mezclar estos datos con los del informe.
// Cada corrida usa internos y legajos nuevos, así que se puede repetir.
import assert from 'node:assert/strict';
import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { Personal } from '../src/models/Personal.js';
import { Movimiento } from '../src/models/Movimiento.js';
import {
  crearElemento,
  eliminarElemento,
} from '../src/services/elementoService.js';
import {
  crearMovimiento,
  listarMovimientos,
  actualizarMovimiento,
  eliminarMovimiento,
} from '../src/services/movimientoService.js';

process.env.DB_NAME = 'logistica_pruebas';

const sufijo = String(Date.now()).slice(-5);
const ok = (texto) => console.log(`ok - ${texto}`);

async function asignadoA(elemento) {
  return (await Elemento.findById(elemento._id)).asignado_a;
}

async function main() {
  await conectar();
  await Elemento.syncIndexes();

  // Preparación
  const [agente, otroAgente, supervisor] = await Personal.create([
    { lp: Number(`1${sufijo}`), jerarquia: 'Oficial', dni: '1', apellido: 'Prueba', nombre: 'Agente' },
    { lp: Number(`2${sufijo}`), jerarquia: 'Oficial', dni: '2', apellido: 'Prueba', nombre: 'Otro' },
    { lp: Number(`3${sufijo}`), jerarquia: 'Principal', dni: '3', apellido: 'Prueba', nombre: 'Supervisor' },
  ]);
  const ht = await crearElemento({ tipo_elemento: 'HT', interno: `T${sufijo}`, marca: 'Motorola', modelo: 'MTP 3250', nro_serie: `S${sufijo}` });
  const movil = await crearElemento({ tipo_elemento: 'Móvil', subtipo: 'camioneta', interno: `T${sufijo}`, marca: 'Ford', modelo: 'Ranger', dominio: 'AA000AA', ploteado: 'Identificable' });
  const roto = await crearElemento({ tipo_elemento: 'HT', interno: `R${sufijo}`, marca: 'Sepura', modelo: 'STP9080', nro_serie: `R${sufijo}`, estado: 'en reparación' });

  const base = {
    fecha: new Date(),
    hora: '08:00',
    asignado: agente._id,
    supervisor: supervisor._id,
  };
  const salida = (ids, extra = {}) =>
    crearMovimiento({ ...base, tipo_movimiento: 'Salida', elementos_ids: ids, ...extra });
  const entrada = (ids, extra = {}) =>
    crearMovimiento({ ...base, tipo_movimiento: 'Entrada', elementos_ids: ids, ...extra });
  const contarMovimientos = () => Movimiento.countDocuments();

  // ---------- CREATE de elementos ----------
  assert.equal(await asignadoA(ht), null);
  ok('crearElemento: el elemento nace en base');

  await assert.rejects(
    () => crearElemento({ tipo_elemento: 'HT', interno: `T${sufijo}`, marca: 'X', modelo: 'Y', nro_serie: 'Z' }),
    /Ya existe un HT activo/,
  );
  ok('crearElemento: no permite repetir interno entre activos del mismo tipo');

  // ---------- Salida ----------
  const mov = await salida([ht._id, movil._id]);
  assert.equal(String(await asignadoA(ht)), String(agente._id));
  assert.equal(String(await asignadoA(movil)), String(agente._id));
  assert.deepEqual(
    mov.elementos.map((e) => [e.tipo_elemento, e.interno, e.subtipo]),
    [['HT', `T${sufijo}`, undefined], ['Móvil', `T${sufijo}`, 'camioneta']],
  );
  ok('Salida: asigna los elementos y embebe tipo, interno y subtipo');

  let antes = await contarMovimientos();
  await assert.rejects(() => salida([ht._id]), /ya está asignado/);
  assert.equal(await contarMovimientos(), antes);
  ok('Salida: rechaza un elemento ya asignado sin guardar el movimiento');

  // Transacción: un elemento válido + uno en reparación -> no se aplica nada
  const libre = await crearElemento({ tipo_elemento: 'HT', interno: `L${sufijo}`, marca: 'Motorola', modelo: 'MTP 3250', nro_serie: `L${sufijo}` });
  antes = await contarMovimientos();
  await assert.rejects(() => salida([libre._id, roto._id]), /no está operativo/);
  assert.equal(await asignadoA(libre), null);
  assert.equal(await contarMovimientos(), antes);
  ok('Salida: si un elemento falla, la transacción no asigna ninguno');

  await assert.rejects(() => salida([libre._id, libre._id]), /repetir/);
  ok('Salida: rechaza elementos repetidos');

  await assert.rejects(
    () => salida([libre._id], { supervisor: '000000000000000000000000' }),
    /No existe un personal activo/,
  );
  ok('Salida: el supervisor tiene que ser personal activo');

  // ---------- DELETE lógico de un elemento asignado ----------
  await assert.rejects(() => eliminarElemento(ht._id, 'Prueba'), /está asignado/);
  ok('eliminarElemento: no da de baja un elemento asignado');

  // ---------- Entrada ----------
  await assert.rejects(
    () => entrada([ht._id], { asignado: otroAgente._id }),
    /no está asignado a ese personal/,
  );
  ok('Entrada: solo la registra quien tiene el elemento');

  await entrada([ht._id, movil._id], { hora: '19:00' });
  assert.equal(await asignadoA(ht), null);
  assert.equal(await asignadoA(movil), null);
  ok('Entrada: los elementos vuelven a base');

  // ---------- READ ----------
  const listado = await listarMovimientos({ asignado: agente._id });
  assert.equal(listado.length, 2);
  assert.equal(listado[0].tipo_movimiento, 'Entrada'); // más reciente primero
  ok('listarMovimientos: trae los movimientos activos, del más reciente al más antiguo');

  // ---------- UPDATE ----------
  const actualizado = await actualizarMovimiento(mov._id, { observaciones: 'Corregido' });
  assert.equal(actualizado.observaciones, 'Corregido');
  await assert.rejects(
    () => actualizarMovimiento(mov._id, { tipo_movimiento: 'Entrada' }),
    /Solo observaciones/,
  );
  ok('actualizarMovimiento: solo modifica observaciones con $set');

  // ---------- DELETE lógico de movimiento ----------
  const anulado = await eliminarMovimiento(mov._id, 'Cargado por error');
  assert.equal(anulado.isEliminado, true);
  assert.ok(anulado.fecha_eliminacion instanceof Date);
  assert.ok(await Movimiento.findById(mov._id));
  assert.equal((await listarMovimientos({ asignado: agente._id })).length, 1);
  ok('eliminarMovimiento: baja lógica; el READ ya no lo lista pero sigue en la base');

  // ---------- DELETE lógico de elemento ----------
  await eliminarElemento(ht._id, 'Prueba de integración');
  await assert.rejects(() => salida([ht._id]), /no existe o está dado de baja/);
  ok('Un elemento dado de baja no puede tener movimientos nuevos');

  await crearElemento({ tipo_elemento: 'HT', interno: `T${sufijo}`, marca: 'Motorola', modelo: 'MTP 3250', nro_serie: `N${sufijo}` });
  ok('Índice parcial: el interno de un elemento dado de baja se puede reutilizar');

  console.log('\nTodas las pruebas de integración pasan.');
}

try {
  await main();
} catch (error) {
  console.error('\nFALLÓ:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

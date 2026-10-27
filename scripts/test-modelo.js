// Prueba las validaciones de los modelos SIN conectarse a Atlas.
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Elemento } from '../src/models/Elemento.js';
import { Personal } from '../src/models/Personal.js';
import { Movimiento } from '../src/models/Movimiento.js';

const errores = (Modelo, datos) =>
  Object.keys(new Modelo(datos).validateSync()?.errors ?? {}).sort();

function probar(Modelo, casos) {
  for (const [nombre, datos, esperado] of casos) {
    assert.deepEqual(errores(Modelo, datos), esperado, nombre);
    console.log(`ok - ${Modelo.modelName}: ${nombre}`);
  }
}

// ---------- Elemento ----------
const ht = {
  tipo_elemento: 'HT',
  interno: '2090101',
  marca: 'Motorola',
  modelo: 'MTP 3250',
  nro_serie: '893TTZ0101',
};
const camioneta = {
  tipo_elemento: 'Móvil',
  subtipo: 'camioneta',
  interno: '1045',
  marca: 'Ford',
  modelo: 'Ranger',
  dominio: 'ab123cd',
  ploteado: 'Identificable',
};

probar(Elemento, [
  ['HT válido', ht, []],
  ['Móvil válido', camioneta, []],
  [
    'Bicicleta sin dominio',
    { ...camioneta, subtipo: 'bicicleta', dominio: undefined },
    [],
  ],
  ['HT sin nro_serie', { ...ht, nro_serie: undefined }, ['nro_serie']],
  [
    'HT con campos de móvil',
    { ...ht, dominio: 'AA000AA', ploteado: 'Identificable' },
    ['dominio', 'ploteado'],
  ],
  [
    'Móvil sin subtipo/dominio/ploteado',
    { ...camioneta, subtipo: undefined, dominio: undefined, ploteado: undefined },
    ['dominio', 'ploteado', 'subtipo'],
  ],
  ['Móvil con nro_serie', { ...camioneta, nro_serie: 'X' }, ['nro_serie']],
  [
    'Tipo y estado inexistentes',
    { ...ht, tipo_elemento: 'Dron', nro_serie: undefined, estado: 'perdido' },
    ['estado', 'tipo_elemento'],
  ],
  ['Interno de más de 8 caracteres', { ...ht, interno: '123456789' }, ['interno']],
  ['Dominio de más de 7 caracteres', { ...camioneta, dominio: 'AB123CDE' }, ['dominio']],
]);

const nuevo = new Elemento(camioneta);
assert.equal(nuevo.dominio, 'AB123CD');
assert.equal(nuevo.isEliminado, false);
assert.equal(nuevo.estado, 'Operativo');
assert.equal(nuevo.asignado_a, null);
console.log('ok - Elemento: valores por defecto y dominio en mayúsculas');

// ---------- Personal ----------
const persona = {
  lp: 4521,
  jerarquia: 'Oficial Primero',
  dni: '30123456',
  apellido: 'Gómez',
  nombre: 'Carlos',
};

probar(Personal, [
  ['Personal válido', persona, []],
  ['Jerarquía inexistente', { ...persona, jerarquia: 'Sargento' }, ['jerarquia']],
  ['LP negativo', { ...persona, lp: -5 }, ['lp']],
  ['LP de más de 7 números', { ...persona, lp: 12345678 }, ['lp']],
  [
    'Sin DNI, apellido ni nombre',
    { ...persona, dni: undefined, apellido: undefined, nombre: undefined },
    ['apellido', 'dni', 'nombre'],
  ],
]);

// ---------- Movimiento ----------
const id = () => new mongoose.Types.ObjectId();
const itemHT = { elemento_id: id(), tipo_elemento: 'HT', interno: '2090101' };
const itemMovil = {
  elemento_id: id(),
  tipo_elemento: 'Móvil',
  subtipo: 'camioneta',
  interno: '1045',
};
const movimiento = {
  fecha: new Date('2026-10-20T00:00:00Z'),
  hora: '08:30',
  tipo_movimiento: 'Salida',
  asignado: id(),
  supervisor: id(),
  elementos: [itemHT, itemMovil],
};

probar(Movimiento, [
  ['Movimiento válido', movimiento, []],
  ['Hora con formato inválido', { ...movimiento, hora: '8:30hs' }, ['hora']],
  ['Hora fuera de rango', { ...movimiento, hora: '25:00' }, ['hora']],
  ['Tipo de movimiento inexistente', { ...movimiento, tipo_movimiento: 'Traslado' }, ['tipo_movimiento']],
  ['Sin elementos', { ...movimiento, elementos: [] }, ['elementos']],
  ['Elemento repetido', { ...movimiento, elementos: [itemHT, itemHT] }, ['elementos']],
  [
    'Ítem móvil sin subtipo',
    { ...movimiento, elementos: [{ ...itemMovil, subtipo: undefined }] },
    ['elementos.0.subtipo'],
  ],
  [
    'Ítem HT con subtipo',
    { ...movimiento, elementos: [{ ...itemHT, subtipo: 'moto' }] },
    ['elementos.0.subtipo'],
  ],
  [
    'Sin asignado ni supervisor',
    { ...movimiento, asignado: undefined, supervisor: undefined },
    ['asignado', 'supervisor'],
  ],
]);

// ---------- Borrado físico bloqueado ----------
for (const Modelo of [Elemento, Personal, Movimiento]) {
  await assert.rejects(() => Modelo.deleteOne({}), /Borrado físico prohibido/);
  await assert.rejects(() => Modelo.deleteMany({}), /Borrado físico prohibido/);
  await assert.rejects(
    () => Modelo.findOneAndDelete({}),
    /Borrado físico prohibido/,
  );
  console.log(`ok - ${Modelo.modelName}: borrado físico bloqueado`);
}
await assert.rejects(() => nuevo.deleteOne(), /Borrado físico prohibido/);
console.log('ok - Elemento: doc.deleteOne() bloqueado');

console.log('\nTodas las validaciones pasan.');
process.exit(0);

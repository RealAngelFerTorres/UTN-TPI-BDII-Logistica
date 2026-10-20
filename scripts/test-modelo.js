// Prueba las validaciones del modelo Elemento SIN conectarse a Atlas.
import assert from 'node:assert/strict';
import { Elemento } from '../src/models/Elemento.js';

const errores = (datos) => Object.keys(new Elemento(datos).validateSync()?.errors ?? {}).sort();

const casos = [
  ['HT válido', { tipo_elemento: 'HT', interno: 'HT-1', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-1' }, []],
  ['Móvil válido', { tipo_elemento: 'Móvil', subtipo: 'camioneta', interno: 'M-1', marca: 'Ford', modelo: 'Ranger', dominio: 'ab123cd', ploteado: 'Identificable' }, []],
  ['Bicicleta sin dominio', { tipo_elemento: 'Móvil', subtipo: 'bicicleta', interno: 'B-1', marca: 'Zenith', modelo: 'Urbana', ploteado: 'Identificable' }, []],
  ['HT sin nro_serie', { tipo_elemento: 'HT', interno: 'HT-2', marca: 'Motorola', modelo: 'MTP 3250' }, ['nro_serie']],
  ['HT con campos de móvil', { tipo_elemento: 'HT', interno: 'HT-3', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-3', dominio: 'AA000AA', ploteado: 'Identificable' }, ['dominio', 'ploteado']],
  ['Móvil sin subtipo/dominio/ploteado', { tipo_elemento: 'Móvil', interno: 'M-2', marca: 'Ford', modelo: 'Ranger' }, ['dominio', 'ploteado', 'subtipo']],
  ['Móvil con nro_serie', { tipo_elemento: 'Móvil', subtipo: 'moto', interno: 'MT-1', marca: 'Yamaha', modelo: 'XTZ', dominio: 'A123BCD', ploteado: 'Identificable', nro_serie: 'X' }, ['nro_serie']],
  ['Tipo y estado inexistentes', { tipo_elemento: 'Dron', interno: 'D-1', marca: 'X', modelo: 'Y', estado: 'perdido' }, ['estado', 'tipo_elemento']],
];

for (const [nombre, datos, esperado] of casos) {
  assert.deepEqual(errores(datos), esperado, nombre);
  console.log(`ok - ${nombre}`);
}

const nuevo = new Elemento(casos[1][1]);
assert.equal(nuevo.dominio, 'AB123CD');
assert.equal(nuevo.isEliminado, false);
assert.equal(nuevo.estado, 'operativo');
assert.equal(nuevo.asignado_a, null);
console.log('ok - valores por defecto y dominio en mayúsculas');

await assert.rejects(() => Elemento.deleteOne({}), /Borrado físico prohibido/);
await assert.rejects(() => Elemento.deleteMany({}), /Borrado físico prohibido/);
await assert.rejects(() => nuevo.deleteOne(), /Borrado físico prohibido/);
console.log('ok - deleteOne / deleteMany bloqueados');

console.log('\nTodas las validaciones pasan.');
process.exit(0);

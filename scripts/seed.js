// Carga datos de prueba FICTICIOS en Atlas (ningún dato real de la dependencia).
// Se puede correr varias veces: solo inserta lo que todavía no existe.
import { conectar, desconectar } from '../src/db.js';
import { Personal } from '../src/models/Personal.js';
import { Elemento } from '../src/models/Elemento.js';
import { crearElemento } from '../src/elementos.js';

const personal = [
  { lp: 4521, jerarquia: 'Oficial Primero', dni: '30123456', apellido: 'Gómez', nombre: 'Carlos' },
  { lp: 3310, jerarquia: 'Inspector', dni: '27456789', apellido: 'Fernández', nombre: 'Laura' },
  { lp: 5102, jerarquia: 'Oficial', dni: '38901234', apellido: 'Ruiz', nombre: 'Martín' },
  { lp: 4877, jerarquia: 'Oficial Mayor', dni: '33567890', apellido: 'Sosa', nombre: 'Valeria' },
  { lp: 2045, jerarquia: 'Principal', dni: '25678901', apellido: 'Benítez', nombre: 'Jorge' },
  { lp: 5230, jerarquia: 'Oficial', dni: '40112233', apellido: 'Acosta', nombre: 'Paula' },
];

// asignado_lp se traduce al _id del personal antes de insertar
const elementos = [
  { tipo_elemento: 'HT', interno: 'HT-010', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-884201' },
  { tipo_elemento: 'HT', interno: 'HT-011', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-884207', asignado_lp: 5102 },
  { tipo_elemento: 'HT', interno: 'HT-012', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-884213', asignado_lp: 4521 },
  { tipo_elemento: 'HT', interno: 'HT-013', marca: 'Sepura', modelo: 'STP9080', nro_serie: 'SP-220931' },
  { tipo_elemento: 'HT', interno: 'HT-014', marca: 'Sepura', modelo: 'STP9080', nro_serie: 'SP-220945', estado: 'en reparación', observaciones: 'No carga la batería' },
  { tipo_elemento: 'HT', interno: 'HT-015', marca: 'Motorola', modelo: 'MTP 3250', nro_serie: 'SN-884230', estado: 'en préstamo', observaciones: 'Prestado a otra dependencia' },
  { tipo_elemento: 'Móvil', subtipo: 'camioneta', interno: 'M-045', marca: 'Ford', modelo: 'Ranger', dominio: 'AB123CD', ploteado: 'Identificable' },
  { tipo_elemento: 'Móvil', subtipo: 'camioneta', interno: 'M-046', marca: 'Nissan', modelo: 'Frontier', dominio: 'AC456EF', ploteado: 'Identificable', asignado_lp: 4877 },
  { tipo_elemento: 'Móvil', subtipo: 'móvil', interno: 'M-050', marca: 'Peugeot', modelo: '208', dominio: 'AD789GH', ploteado: 'No identificable' },
  { tipo_elemento: 'Móvil', subtipo: 'móvil', interno: 'M-051', marca: 'Ford', modelo: 'Focus', dominio: 'ABC123', ploteado: 'Identificable', estado: 'radiado' },
  { tipo_elemento: 'Móvil', subtipo: 'moto', interno: 'MT-07', marca: 'Yamaha', modelo: 'XTZ 250', dominio: 'A123BCD', ploteado: 'Identificable', asignado_lp: 3310 },
  { tipo_elemento: 'Móvil', subtipo: 'bicicleta', interno: 'B-02', marca: 'Zenith', modelo: 'Urbana', ploteado: 'Identificable' },
];

async function main() {
  await conectar();
  await Elemento.syncIndexes(); // crea el índice único parcial de interno

  let nuevos = 0;
  const idPorLp = new Map();
  for (const p of personal) {
    let doc = await Personal.findOne({ lp: p.lp, isEliminado: false });
    if (!doc) {
      doc = await Personal.create(p);
      nuevos++;
    }
    idPorLp.set(p.lp, doc._id);
  }
  console.log(`personal: ${nuevos} insertados, ${personal.length - nuevos} ya existían`);

  nuevos = 0;
  for (const { asignado_lp, ...e } of elementos) {
    const existe = await Elemento.exists({ tipo_elemento: e.tipo_elemento, interno: e.interno, isEliminado: false });
    if (!existe) {
      await crearElemento({ ...e, asignado_a: asignado_lp ? idPorLp.get(asignado_lp) : null });
      nuevos++;
    }
  }
  console.log(`elementos: ${nuevos} insertados, ${elementos.length - nuevos} ya existían`);
}

try {
  await main();
} catch (error) {
  console.error('Error al cargar los datos de prueba:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

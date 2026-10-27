// Carga datos de prueba FICTICIOS en Atlas (ningún dato real de la dependencia).
// Se puede correr varias veces: solo inserta lo que todavía no existe.
import { conectar, desconectar } from '../src/db.js';
import { Personal } from '../src/models/Personal.js';
import { Elemento } from '../src/models/Elemento.js';
import { Movimiento } from '../src/models/Movimiento.js';
import { crearElemento } from '../src/services/elementoService.js';
import { crearMovimiento } from '../src/services/movimientoService.js';

const OBSERVACION_SEED = 'Datos de prueba (seed)';

const personal = [
  {
    lp: 4521,
    jerarquia: 'Oficial Primero',
    dni: '30123456',
    apellido: 'Gómez',
    nombre: 'Carlos',
  },
  {
    lp: 3310,
    jerarquia: 'Inspector',
    dni: '27456789',
    apellido: 'Fernández',
    nombre: 'Laura',
  },
  {
    lp: 5102,
    jerarquia: 'Oficial',
    dni: '38901234',
    apellido: 'Ruiz',
    nombre: 'Martín',
  },
  {
    lp: 4877,
    jerarquia: 'Oficial Mayor',
    dni: '33567890',
    apellido: 'Sosa',
    nombre: 'Valeria',
  },
  {
    lp: 2045,
    jerarquia: 'Principal',
    dni: '25678901',
    apellido: 'Benítez',
    nombre: 'Jorge',
    observaciones: 'Logística',
  },
  {
    lp: 5230,
    jerarquia: 'Oficial',
    dni: '40112233',
    apellido: 'Acosta',
    nombre: 'Paula',
    observaciones: 'Logística',
  },
];

// Todos los elementos nacen en base (crearElemento ignora asignado_a).
// Las asignaciones se hacen más abajo registrando movimientos.
const elementos = [
  {
    tipo_elemento: 'HT',
    interno: '2090101',
    marca: 'Motorola',
    modelo: 'MTP 3250',
    nro_serie: '893TTZ0101',
  },
  {
    tipo_elemento: 'HT',
    interno: '2090102',
    marca: 'Motorola',
    modelo: 'MTP 3250',
    nro_serie: '893TTZ0102',
  },
  {
    tipo_elemento: 'HT',
    interno: '2090103',
    marca: 'Motorola',
    modelo: 'MTP 3250',
    nro_serie: '893TTZ0103',
  },
  {
    tipo_elemento: 'HT',
    interno: '2090201',
    marca: 'Sepura',
    modelo: 'STP9080',
    nro_serie: '1PRG0000ZZ00201',
  },
  {
    tipo_elemento: 'HT',
    interno: '2090202',
    marca: 'Sepura',
    modelo: 'STP9080',
    nro_serie: '1PRG0000ZZ00202',
    estado: 'En reparación',
    observaciones: 'No carga la batería',
  },
  {
    tipo_elemento: 'HT',
    interno: '2090104',
    marca: 'Motorola',
    modelo: 'MTP 3250',
    nro_serie: '893TTZ0104',
    estado: 'En préstamo',
    observaciones: 'Prestado a otra dependencia',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'camioneta',
    interno: '1045',
    marca: 'Ford',
    modelo: 'Ranger',
    dominio: 'AB123CD',
    ploteado: 'Identificable',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'camioneta',
    interno: '2046',
    marca: 'Nissan',
    modelo: 'Frontier',
    dominio: 'AC456EF',
    ploteado: 'Identificable',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'móvil',
    interno: '5550',
    marca: 'Peugeot',
    modelo: '208',
    dominio: 'AD789GH',
    ploteado: 'No identificable',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'móvil',
    interno: '5199',
    marca: 'Ford',
    modelo: 'Focus',
    dominio: 'ABC123',
    ploteado: 'Identificable',
    estado: 'Radiado',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'moto',
    interno: '3307',
    marca: 'Yamaha',
    modelo: 'XTZ 250',
    dominio: 'A123BCD',
    ploteado: 'Identificable',
  },
  {
    tipo_elemento: 'Móvil',
    subtipo: 'bicicleta',
    interno: 'B212',
    marca: 'Zenith',
    modelo: 'Urbana',
    ploteado: 'Identificable',
  },
];

// Historial de prueba, en orden cronológico. Al final quedan asignados:
// 2090102 a Ruiz, 2090103 y 2046 a Sosa, 3307 a Fernández.
const movimientos = [
  {
    fecha: '2026-10-19',
    hora: '07:45',
    tipo_movimiento: 'Salida',
    asignado_lp: 5102,
    supervisor_lp: 2045,
    internos: ['2090102'],
  },
  {
    fecha: '2026-10-19',
    hora: '07:50',
    tipo_movimiento: 'Salida',
    asignado_lp: 4521,
    supervisor_lp: 2045,
    internos: ['2090103', '2046'],
  },
  {
    fecha: '2026-10-19',
    hora: '19:55',
    tipo_movimiento: 'Entrada',
    asignado_lp: 4521,
    supervisor_lp: 5230,
    internos: ['2090103', '2046'],
  },
  {
    fecha: '2026-10-20',
    hora: '07:40',
    tipo_movimiento: 'Salida',
    asignado_lp: 4877,
    supervisor_lp: 5230,
    internos: ['2046', '2090103'],
  },
  {
    fecha: '2026-10-20',
    hora: '08:10',
    tipo_movimiento: 'Salida',
    asignado_lp: 3310,
    supervisor_lp: 2045,
    internos: ['3307'],
  },
];

async function cargarPersonal() {
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
  console.log(
    `personal: ${nuevos} insertados, ${personal.length - nuevos} ya existían`,
  );
  return idPorLp;
}

async function cargarElementos() {
  let nuevos = 0;
  const idPorInterno = new Map();
  for (const e of elementos) {
    let doc = await Elemento.findOne({
      tipo_elemento: e.tipo_elemento,
      interno: e.interno,
      isEliminado: false,
    });
    if (!doc) {
      doc = await crearElemento(e);
      nuevos++;
    }
    idPorInterno.set(e.interno, doc._id);
  }
  console.log(
    `elementos: ${nuevos} insertados, ${elementos.length - nuevos} ya existían`,
  );
  return idPorInterno;
}

async function cargarMovimientos(idPorLp, idPorInterno) {
  // Los movimientos cambian asignado_a, así que se cargan una sola vez
  if (await Movimiento.exists({ observaciones: OBSERVACION_SEED })) {
    console.log('movimientos: ya estaban cargados');
    return;
  }
  for (const m of movimientos) {
    await crearMovimiento({
      fecha: new Date(`${m.fecha}T00:00:00Z`),
      hora: m.hora,
      tipo_movimiento: m.tipo_movimiento,
      asignado: idPorLp.get(m.asignado_lp),
      supervisor: idPorLp.get(m.supervisor_lp),
      elementos_ids: m.internos.map((interno) => idPorInterno.get(interno)),
      observaciones: OBSERVACION_SEED,
    });
  }
  console.log(`movimientos: ${movimientos.length} insertados`);
}

async function main() {
  await conectar();
  await Elemento.syncIndexes(); // crea el índice único parcial de interno

  const idPorLp = await cargarPersonal();
  const idPorInterno = await cargarElementos();
  await cargarMovimientos(idPorLp, idPorInterno);
}

try {
  await main();
} catch (error) {
  console.error('Error al cargar los datos de prueba:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

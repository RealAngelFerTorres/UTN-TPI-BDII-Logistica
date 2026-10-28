import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { crearElemento } from '../src/services/elementoService.js';

function titulo(texto) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(texto);
  console.log('='.repeat(60));
}

async function crearSiNoExiste(datos) {
  const existente = await Elemento.findOne({
    tipo_elemento: datos.tipo_elemento,
    interno: datos.interno,
    isEliminado: false,
  });

  if (existente) {
    console.log(
      `YA EXISTE | ${datos.tipo_elemento} | interno: ${datos.interno} | _id: ${existente._id}`,
    );
    return { creado: false, elemento: existente };
  }

  const elemento = await crearElemento(datos);

  console.log(
    `CREADO | ${elemento.tipo_elemento} | interno: ${elemento.interno} | ` +
      `${elemento.marca} ${elemento.modelo} | _id: ${elemento._id}`,
  );

  return { creado: true, elemento };
}

async function main() {
  await conectar();

  const elementos = [
    // 10 HT
    {
      tipo_elemento: 'HT',
      interno: 'HT900001',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-001',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900002',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-002',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900003',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-003',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900004',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-004',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900005',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-005',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900006',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-006',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900007',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-007',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900008',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-008',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900009',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-009',
    },
    {
      tipo_elemento: 'HT',
      interno: 'HT900010',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      nro_serie: 'DEMO-HT-010',
    },

    // 3 móviles
    {
      tipo_elemento: 'Móvil',
      subtipo: 'camioneta',
      interno: 'MV90001',
      marca: 'Ford',
      modelo: 'Ranger',
      dominio: 'DEMO01',
      ploteado: 'Identificable',
    },
    {
      tipo_elemento: 'Móvil',
      subtipo: 'moto',
      interno: 'MV90002',
      marca: 'Honda',
      modelo: 'XR 250',
      dominio: 'DEMO02',
      ploteado: 'Identificable',
    },
    {
      tipo_elemento: 'Móvil',
      subtipo: 'bicicleta',
      interno: 'MV90003',
      marca: 'Venzo',
      modelo: 'Raptor',
      ploteado: 'No identificable',
    },
  ];

  let creados = 0;
  let existentes = 0;
  let fallidos = 0;

  titulo('CREATE: carga de 10 HT y 3 móviles');

  for (const datos of elementos) {
    try {
      const resultado = await crearSiNoExiste(datos);

      if (resultado.creado) {
        creados++;
      } else {
        existentes++;
      }
    } catch (error) {
      fallidos++;
      console.error(
        `ERROR | ${datos.tipo_elemento} | interno: ${datos.interno}`,
      );
      console.error(`Motivo: ${error.message}`);
    }
  }

  titulo('VERIFICACIÓN EN LA BASE DE DATOS');

  const internos = elementos.map((e) => e.interno);

  const cargados = await Elemento.find({
    interno: { $in: internos },
    isEliminado: false,
  }).sort({ tipo_elemento: 1, interno: 1 });

  console.table(
    cargados.map((e) => ({
      tipo: e.tipo_elemento,
      interno: e.interno,
      subtipo: e.subtipo ?? '-',
      marca: e.marca,
      modelo: e.modelo,
      dominio: e.dominio ?? '-',
      estado: e.estado,
      asignado_a: e.asignado_a ? String(e.asignado_a) : 'Sin asignar',
      eliminado: e.isEliminado,
    })),
  );

  titulo('RESUMEN');

  console.log(`Solicitados: ${elementos.length}`);
  console.log(`Creados ahora: ${creados}`);
  console.log(`Ya existían: ${existentes}`);
  console.log(`Fallidos: ${fallidos}`);
  console.log(`Encontrados activos: ${cargados.length}`);

  if (cargados.length !== elementos.length || fallidos > 0) {
    console.warn('La carga no terminó completamente como se esperaba.');
    process.exitCode = 1;
  } else {
    console.log('Carga verificada correctamente.');
  }
}

try {
  await main();
} catch (error) {
  console.error('Error en Main.js:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

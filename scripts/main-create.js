import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { crearElemento } from '../src/services/elementoService.js';
import { Personal } from '../src/models/Personal.js';

// ==================================================
// FUNCIONES GENERALES
// ==================================================

function titulo(texto) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(texto);
  console.log('='.repeat(60));
}

// ==================================================
// CREACIÓN DE ELEMENTOS
// ==================================================

async function crearSiNoExiste(datos) {
  const existente = await Elemento.findOne({
    tipo_elemento: datos.tipo_elemento,
    interno: datos.interno,
    isEliminado: false,
  });

  if (existente) {
    console.log(
      `YA EXISTE | ${datos.tipo_elemento} | ` +
        `Interno: ${datos.interno} | _id: ${existente._id}`,
    );

    return { creado: false, elemento: existente };
  }

  const elemento = await crearElemento(datos);

  console.log(
    `CREADO | ${elemento.tipo_elemento} | ` +
      `Interno: ${elemento.interno} | ` +
      `${elemento.marca} ${elemento.modelo} | ` +
      `_id: ${elemento._id}`,
  );

  return { creado: true, elemento };
}

// ==================================================
// CREACIÓN DE PERSONAL
// ==================================================

async function crearPersonalDemo() {
  const personas = [
    {
      lp: 9000001,
      dni: '90000001',
      jerarquia: 'Oficial',
      apellido: 'Fernández',
      nombre: 'Andrés',
    },
    {
      lp: 9000002,
      dni: '90000002',
      jerarquia: 'Oficial',
      apellido: 'García',
      nombre: 'Bruno',
    },
    {
      lp: 9000003,
      dni: '90000003',
      jerarquia: 'Oficial',
      apellido: 'Martínez',
      nombre: 'Carlos',
    },
    {
      lp: 9000004,
      dni: '90000004',
      jerarquia: 'Oficial Mayor',
      apellido: 'Juárez',
      nombre: 'Javier',
    },
  ];

  const resumen = {
    creados: 0,
    existentes: 0,
    fallidos: 0,
  };

  titulo('CREATE: PERSONAL');

  for (const datos of personas) {
    try {
      const existente = await Personal.findOne({
        lp: datos.lp,
        isEliminado: false,
      });

      if (existente) {
        resumen.existentes++;

        console.log(
          `YA EXISTE | LP: ${existente.lp} | ` +
            `${existente.apellido}, ${existente.nombre} | ` +
            `_id: ${existente._id}`,
        );

        continue;
      }

      const creado = await Personal.create(datos);
      resumen.creados++;

      console.log(
        `CREADO | LP: ${creado.lp} | ` +
          `${creado.apellido}, ${creado.nombre} | ` +
          `_id: ${creado._id}`,
      );
    } catch (error) {
      resumen.fallidos++;

      console.error(
        `ERROR | LP: ${datos.lp} | ` + `${datos.apellido}, ${datos.nombre}`,
      );

      console.error(`Motivo: ${error.message}`);
    }
  }

  return resumen;
}

// ==================================================
// TABLA DE PERSONAL
// ==================================================

async function mostrarPersonal() {
  const personal = await Personal.find({
    lp: { $in: [9000001, 9000002, 9000003, 9000004] },
    isEliminado: false,
  })
    .sort({ lp: 1 })
    .lean();

  titulo('VERIFICACIÓN CON LA BASE DE DATOS: PERSONAL');

  if (personal.length === 0) {
    console.log('No se encontró personal para mostrar.');
    return;
  }

  console.table(
    personal.map((persona) => ({
      LP: persona.lp,
      Jerarquía: persona.jerarquia,
      Apellido: persona.apellido,
      Nombre: persona.nombre,
      DNI: persona.dni,
    })),
  );

  console.log(`Total de personas encontradas: ${personal.length}`);
}

// ==================================================
// TABLA DE ELEMENTOS
// ==================================================

async function mostrarElementos(elementos) {
  const internos = elementos.map((elemento) => elemento.interno);

  const cargados = await Elemento.find({
    interno: { $in: internos },
    isEliminado: false,
  }).sort({ tipo_elemento: 1, interno: 1 });

  titulo('VERIFICACIÓN CON LA BASE DE DATOS: ELEMENTOS');

  if (cargados.length === 0) {
    console.log('No se encontraron elementos activos.');
    return cargados;
  }

  console.table(
    cargados.map((elemento) => ({
      Tipo: elemento.tipo_elemento,
      Interno: elemento.interno,
      Subtipo: elemento.subtipo ?? '-',
      Marca: elemento.marca,
      Modelo: elemento.modelo,
      Dominio: elemento.dominio ?? '-',
      Estado: elemento.estado,
      Asignado: elemento.asignado_a
        ? String(elemento.asignado_a)
        : 'Sin asignar',
      Eliminado: elemento.isEliminado,
    })),
  );

  console.log(`Total de elementos encontrados: ${cargados.length}`);

  return cargados;
}

// ==================================================
// FUNCIÓN PRINCIPAL
// ==================================================

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

  const resumenElementos = {
    creados: 0,
    existentes: 0,
    fallidos: 0,
  };

  titulo('CREATE: 10 HT Y 3 MÓVILES');

  // Crear elementos y contabilizar resultados.
  for (const datos of elementos) {
    try {
      const resultado = await crearSiNoExiste(datos);

      if (resultado.creado) {
        resumenElementos.creados++;
      } else {
        resumenElementos.existentes++;
      }
    } catch (error) {
      resumenElementos.fallidos++;

      console.error(
        `ERROR | ${datos.tipo_elemento} | Interno: ${datos.interno}`,
      );

      console.error(`Motivo: ${error.message}`);
    }
  }

  // Crear personal y obtener sus contadores.
  const resumenPersonal = await crearPersonalDemo();

  // Mostrar las tablas de verificación.
  const cargados = await mostrarElementos(elementos);
  await mostrarPersonal();

  // Contar registros activos del personal de prueba.
  const personalActivo = await Personal.countDocuments({
    lp: { $in: [9000001, 9000002, 9000003, 9000004] },
    isEliminado: false,
  });

  // ==================================================
  // RESUMEN FINAL
  // ==================================================

  titulo('RESUMEN GENERAL');

  console.log('\n--- ELEMENTOS ---');
  console.log(`Solicitados: ${elementos.length}`);
  console.log(`Creados ahora: ${resumenElementos.creados}`);
  console.log(`Ya existían: ${resumenElementos.existentes}`);
  console.log(`Fallidos: ${resumenElementos.fallidos}`);
  console.log(`Encontrados activos: ${cargados.length}`);

  console.log('\n--- PERSONAL ---');
  console.log('Solicitados: 4');
  console.log(`Creados ahora: ${resumenPersonal.creados}`);
  console.log(`Ya existían: ${resumenPersonal.existentes}`);
  console.log(`Fallidos: ${resumenPersonal.fallidos}`);
  console.log(`Encontrados activos: ${personalActivo}`);

  const elementosCorrectos =
    cargados.length === elementos.length && resumenElementos.fallidos === 0;

  const personalCorrecto =
    personalActivo === 4 && resumenPersonal.fallidos === 0;

  if (!elementosCorrectos || !personalCorrecto) {
    console.warn('\nLa carga no terminó completamente como se esperaba.');

    process.exitCode = 1;
  } else {
    console.log('\nCarga verificada correctamente.');
  }
}

// ==================================================
// EJECUCIÓN Y CIERRE DE CONEXIÓN
// ==================================================

try {
  await main();
} catch (error) {
  console.error('Error en Main.js:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

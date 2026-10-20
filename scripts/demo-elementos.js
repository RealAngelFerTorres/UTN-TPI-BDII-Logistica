// Demo del CREATE y del DELETE lógico de elementos contra Atlas.
// Sirve para sacar las capturas del informe y para mostrar en el coloquio.
import { conectar, desconectar } from '../src/db.js';
import { Elemento } from '../src/models/Elemento.js';
import { crearElemento, eliminarElemento } from '../src/elementos.js';

function titulo(texto) {
  console.log(`\n=== ${texto} ===`);
}

async function main() {
  await conectar();

  titulo('1. CREATE: alta de un HT nuevo');
  const interno = `HT-9${String(Date.now()).slice(-2)}`;
  const ht = await crearElemento({
    tipo_elemento: 'HT',
    interno,
    marca: 'Motorola',
    modelo: 'MTP 3250',
    nro_serie: `SN-DEMO-${Date.now()}`,
    observaciones: 'Cargado por demo-elementos.js',
  });
  console.log(ht.toObject());

  titulo('2. CREATE con datos inválidos (HT sin nro_serie y con dominio)');
  try {
    await crearElemento({
      tipo_elemento: 'HT',
      interno: 'HT-X',
      marca: 'Motorola',
      modelo: 'MTP 3250',
      dominio: 'AA000AA',
    });
  } catch (error) {
    console.log('Rechazado:', error.message);
  }

  titulo('3. DELETE lógico del HT recién creado');
  const eliminado = await eliminarElemento(ht._id, 'Alta de prueba');
  console.log({
    _id: eliminado._id,
    interno: eliminado.interno,
    isEliminado: eliminado.isEliminado,
    fecha_eliminacion: eliminado.fecha_eliminacion,
    motivo_eliminacion: eliminado.motivo_eliminacion,
  });

  titulo('4. El documento sigue existiendo en Atlas');
  console.log(
    'findById ->',
    (await Elemento.findById(ht._id)) ? 'encontrado' : 'no existe',
  );

  titulo('5. Intento de borrado físico (tiene que fallar)');
  try {
    await Elemento.deleteOne({ _id: ht._id });
  } catch (error) {
    console.log('Bloqueado:', error.message);
  }

  titulo('6. No se puede dar de baja un elemento asignado');
  const asignado = await Elemento.findOne({
    isEliminado: false,
    asignado_a: { $ne: null },
  });
  if (asignado) {
    try {
      await eliminarElemento(asignado._id, 'Prueba');
    } catch (error) {
      console.log('Rechazado:', error.message);
    }
  } else {
    console.log('(no hay elementos asignados; correr antes npm run seed)');
  }

  titulo('7. Resumen de la colección');
  const total = await Elemento.countDocuments();
  const activos = await Elemento.countDocuments({ isEliminado: false });
  console.log(
    `total: ${total} | activos: ${activos} | dados de baja: ${total - activos}`,
  );
}

try {
  await main();
} catch (error) {
  console.error('Error en la demo:', error.message);
  process.exitCode = 1;
} finally {
  await desconectar();
}

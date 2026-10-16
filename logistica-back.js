import mongoose from 'mongoose';

const url = ''; // String de conexión local TODO
const dbName = ''; // Nombre de la base de datos TODO

// Definición del esquema TODO
const exampleSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
    },
  },
  {
    timestamps: true, // Añade campos createdAt y updatedAt automáticamente
  },
);

// Creación del modelo (equivalente a una colección) TODO
const ExampleModel = mongoose.model('documents', exampleSchema);

async function main() {
  // Conexión a MongoDB usando Mongoose
  await mongoose.connect(`${url}${dbName}`);
  console.log('Conexión exitosa a MongoDB con Mongoose');

  const insertResult = await ExampleModel.insertMany([
    // Esta sintaxis depende de Mongoose pero suele ser muy parecida
    { nombre: 'Sensor de Humedad', stock: 10 },
    { nombre: 'Servo Motor', stock: 5 },
    { nombre: 'LED RGB', stock: 20 },
  ]);

  console.log('Documentos insertados =>', insertResult);

  return 'Completado.';
}

try {
  const result = await main();
  console.log(result);
} catch (error) {
  console.error('Error en la conexión o ejecución:', error);
} finally {
  // Cierre de conexión
  await mongoose.connection.close();
}

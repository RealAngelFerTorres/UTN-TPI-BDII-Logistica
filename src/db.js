import 'dotenv/config';
import mongoose from 'mongoose';

// Conexión única a MongoDB Atlas. El connection string vive en .env (nunca en el repo).
export async function conectar() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env (copiar .env.example y completarlo)');
  }

  // dbName se pasa como opción para no depender de cómo termina el connection string
  await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'logistica' });
  console.log(`Conexión exitosa a MongoDB Atlas (base: ${mongoose.connection.name})`);
}

export async function desconectar() {
  await mongoose.connection.close();
}

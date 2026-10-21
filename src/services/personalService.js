import mongoose from 'mongoose';
import { Personal } from '../models/Personal.js';

// Devuelve el personal activo con ese _id o lanza un error.
// Lo usa movimientoService para validar asignado y supervisor.
export async function buscarPersonalActivo(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`"${id}" no es un _id válido`);
  }

  const persona = await Personal.findOne({ _id: id, isEliminado: false });
  if (!persona) {
    throw new Error('No existe un personal activo con ese _id');
  }
  return persona;
}

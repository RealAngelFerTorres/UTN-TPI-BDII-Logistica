import mongoose from 'mongoose';
import { Personal } from '../models/Personal.js';
import { Elemento } from '../models/Elemento.js';

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

// DELETE (baja lógica): marca al personal como eliminado. Nunca usa deleteOne/deleteMany.
// No se puede dar de baja a quien todavía tiene elementos asignados.
export async function eliminarPersonal(id, motivo) {
  if (!motivo || !motivo.trim()) {
    throw new Error('Hay que indicar el motivo de la baja');
  }
  const persona = await buscarPersonalActivo(id);

  const asignados = await Elemento.find(
    { asignado_a: persona._id, isEliminado: false },
    { interno: 1 },
  );
  if (asignados.length > 0) {
    const internos = asignados.map((e) => e.interno).join(', ');
    throw new Error(
      `${persona.apellido} tiene elementos asignados (${internos}): primero hay que registrar su devolución`,
    );
  }

  return Personal.findOneAndUpdate(
    { _id: persona._id, isEliminado: false },
    {
      $set: {
        isEliminado: true,
        fecha_eliminacion: new Date(),
        motivo_eliminacion: motivo.trim(),
      },
    },
    { returnDocument: 'after' },
  );
}

import mongoose from 'mongoose';

// De mayor a menor
export const JERARQUIAS = [
  'Comisario',
  'Subcomisario',
  'Principal',
  'Inspector',
  'Oficial Mayor',
  'Oficial Primero',
  'Oficial',
];

const personalSchema = new mongoose.Schema(
  {
    lp: { type: Number, required: true }, // legajo personal
    jerarquia: { type: String, enum: JERARQUIAS, required: true },
    dni: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    observaciones: { type: String, default: '' },

    // Baja lógica
    isEliminado: { type: Boolean, default: false },
  },
  { collection: 'personal', versionKey: false },
);

export const Personal = mongoose.model('Personal', personalSchema);

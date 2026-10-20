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
    lp: {
      type: Number,
      trim: true,
      required: true,
      minlength: [1, '{PATH} no puede estar vacío.'],
      max: [9999999, '{PATH} no puede tener más de 7 números.'],
    }, // legajo personal
    jerarquia: { type: String, enum: JERARQUIAS, required: true },
    dni: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [9, '{PATH} no puede tener más de 9 caracteres.'],
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [80, '{PATH} no puede superar los 80 caracteres.'],
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [100, '{PATH} no puede superar los 100 caracteres.'],
    },
    observaciones: {
      type: String,
      default: '',
      maxlength: [500, '{PATH} no puede superar los 500 caracteres.'],
    },

    // Baja lógica
    isEliminado: { type: Boolean, default: false },
  },
  { collection: 'personal', versionKey: false },
);

export const Personal = mongoose.model('Personal', personalSchema);

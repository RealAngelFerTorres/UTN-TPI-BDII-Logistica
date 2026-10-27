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
      required: true,
      // trim y minlength no aplican a Number: se valida con min/max
      min: [1, '{PATH} tiene que ser un número positivo.'],
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

    // Baja lógica: el documento nunca se borra, se marca.
    isEliminado: { type: Boolean, default: false },
    fecha_eliminacion: { type: Date },
    motivo_eliminacion: {
      type: String,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [500, '{PATH} no puede superar los 500 caracteres.'],
    },
  },
  { collection: 'personal', versionKey: false },
);

// Red de seguridad: el borrado físico queda bloqueado a nivel modelo.
function prohibirBorradoFisico() {
  throw new Error(
    'Borrado físico prohibido en personal: usar la baja lógica (eliminarPersonal)',
  );
}
personalSchema.pre(
  'deleteOne',
  { document: true, query: true },
  prohibirBorradoFisico,
);
personalSchema.pre(['deleteMany', 'findOneAndDelete'], prohibirBorradoFisico);

export const Personal = mongoose.model('Personal', personalSchema);

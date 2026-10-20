import mongoose from 'mongoose';
import { TIPOS_ELEMENTO, SUBTIPOS_MOVIL } from './Elemento.js';

export const TIPOS_MOVIMIENTO = ['Salida', 'Entrada'];

// Embedding (copia): cada ítem guarda el elemento_id (linking) más los datos
// estables del elemento, para listar movimientos sin consultar 'elementos'.
// El estado y el asignado_a NO se copian porque cambian constantemente.
function esMovil() {
  return this.tipo_elemento === 'Móvil';
}
const soloMovil = {
  validator: esMovil,
  message: '{PATH} solo aplica a elementos de tipo Móvil',
};

const elementoMovimientoSchema = new mongoose.Schema(
  {
    elemento_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Elemento',
      required: true,
    },
    tipo_elemento: { type: String, enum: TIPOS_ELEMENTO, required: true },
    // Solo móviles
    subtipo: {
      type: String,
      enum: SUBTIPOS_MOVIL,
      required: esMovil,
      validate: soloMovil,
    },
    interno: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [8, '{PATH} no puede superar los 8 caracteres.'],
    },
  },
  { _id: false },
);

const movimientoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true },
    hora: {
      type: String,
      required: true,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, '{PATH} debe tener formato HH:MM.'],
    },
    tipo_movimiento: {
      type: String,
      enum: TIPOS_MOVIMIENTO,
      required: true,
    },

    // Linking: quien recibe o devuelve, y quien de logística habilitó
    asignado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personal',
      required: true,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Personal',
      required: true,
    },

    // Embedding: los elementos forman parte del hecho que se registra
    elementos: {
      type: [elementoMovimientoSchema],
      required: true,
      validate: [
        {
          // un array vacío pasa 'required' en Mongoose, por eso se valida aparte
          validator: (v) => Array.isArray(v) && v.length > 0,
          message: 'Un movimiento debe incluir al menos un elemento.',
        },
        {
          validator: (v) =>
            new Set(v.map((e) => String(e.elemento_id))).size === v.length,
          message: 'No se puede repetir un elemento en el mismo movimiento.',
        },
      ],
    },

    observaciones: {
      type: String,
      default: '',
      maxlength: [500, '{PATH} no puede superar los 500 caracteres.'],
    },

    // Baja lógica
    isEliminado: { type: Boolean, default: false },
    fecha_eliminacion: { type: Date },
    motivo_eliminacion: {
      type: String,
      minlength: [1, '{PATH} no puede estar vacío.'],
      maxlength: [500, '{PATH} no puede superar los 500 caracteres.'],
    },
  },
  { collection: 'movimientos', versionKey: false },
);

// Red de seguridad: el borrado físico queda bloqueado a nivel modelo.
function prohibirBorradoFisico() {
  throw new Error(
    'Borrado físico prohibido en movimientos: usar la baja lógica (eliminarMovimiento)',
  );
}
movimientoSchema.pre(
  'deleteOne',
  { document: true, query: true },
  prohibirBorradoFisico,
);
movimientoSchema.pre(['deleteMany', 'findOneAndDelete'], prohibirBorradoFisico);

export const Movimiento = mongoose.model('Movimiento', movimientoSchema);

import mongoose from 'mongoose';

export const TIPOS_ELEMENTO = ['HT', 'Móvil'];
export const ESTADOS = ['operativo', 'radiado', 'en reparación', 'en préstamo'];
export const SUBTIPOS_MOVIL = ['camioneta', 'móvil', 'moto', 'bicicleta'];
export const PLOTEADOS = ['Identificable', 'No identificable'];

// HT y móviles conviven en la misma colección: cada documento lleva solo
// los campos de su tipo (embedding en el mismo documento, sin campos vacíos).
function esHT() {
  return this.tipo_elemento === 'HT';
}
function esMovil() {
  return this.tipo_elemento === 'Móvil';
}
const soloHT = { validator: esHT, message: '{PATH} solo aplica a elementos de tipo HT' };
const soloMovil = { validator: esMovil, message: '{PATH} solo aplica a elementos de tipo Móvil' };

const elementoSchema = new mongoose.Schema(
  {
    tipo_elemento: { type: String, enum: TIPOS_ELEMENTO, required: true },
    interno: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    estado: { type: String, enum: ESTADOS, default: 'operativo' },
    // Linking: quién tiene el elemento hoy (null = está en base)
    asignado_a: { type: mongoose.Schema.Types.ObjectId, ref: 'Personal', default: null },
    observaciones: { type: String, default: '' },

    // Solo HT
    nro_serie: { type: String, trim: true, required: esHT, validate: soloHT },

    // Solo móviles
    subtipo: { type: String, enum: SUBTIPOS_MOVIL, required: esMovil, validate: soloMovil },
    dominio: {
      type: String,
      trim: true,
      uppercase: true,
      // las bicicletas no tienen patente
      required() {
        return esMovil.call(this) && this.subtipo !== 'bicicleta';
      },
      validate: soloMovil,
    },
    ploteado: { type: String, enum: PLOTEADOS, required: esMovil, validate: soloMovil },

    // Baja lógica: el documento nunca se borra, se marca.
    isEliminado: { type: Boolean, default: false },
    fecha_eliminacion: { type: Date },
    motivo_eliminacion: { type: String },
  },
  { collection: 'elementos', versionKey: false },
);

// Un interno no se puede repetir entre los elementos activos del mismo tipo.
// Es parcial: si un elemento se da de baja, su interno se puede volver a usar.
elementoSchema.index(
  { tipo_elemento: 1, interno: 1 },
  { unique: true, partialFilterExpression: { isEliminado: false } },
);

// Red de seguridad: el borrado físico queda bloqueado a nivel modelo.
function prohibirBorradoFisico() {
  throw new Error('Borrado físico prohibido en elementos: usar la baja lógica (eliminarElemento)');
}
elementoSchema.pre('deleteOne', { document: true, query: true }, prohibirBorradoFisico);
elementoSchema.pre(['deleteMany', 'findOneAndDelete'], prohibirBorradoFisico);

export const Elemento = mongoose.model('Elemento', elementoSchema);

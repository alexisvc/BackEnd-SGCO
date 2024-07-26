const mongoose = require('mongoose')

const periodonciaSchema = new mongoose.Schema({
  diagnosticoPer: String,
  observacionPer: String,
  movilidadInferior: [String],
  furcaInferior: [String],
  sangradoInferior: [String],
  placaInferior: [String],
  mrgGingivalInferiorA: [String],
  profundidadSondajeInferiorA: [String],
  nivelInsercionInferiorA: [String],
  mrgGingivalInferiorB: [String],
  profundidadSondajeInferiorB: [String],
  nivelInsercionInferiorB: [String],
  movilidadSuperior: [String],
  furcaSuperior: [String],
  sangradoSuperior: [String],
  placaSuperior: [String],
  mrgGingivalSuperiorA: [String],
  profundidadSondajeSuperiorA: [String],
  nivelInsercionSuperiorA: [String],
  mrgGingivalSuperiorB: [String],
  profundidadSondajeSuperiorB: [String],
  nivelInsercionSuperiorB: [String],
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true // Asegura que cada paciente tenga solo una periodoncia
  },
  archivo1: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
  },
  archivo2: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
  }
})

periodonciaSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Periodoncia = mongoose.model('Periodoncia', periodonciaSchema)

module.exports = Periodoncia

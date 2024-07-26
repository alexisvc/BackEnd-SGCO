const mongoose = require('mongoose')

const ortodonciaSchema = new mongoose.Schema({
  diagnostico: String,
  objetivo: String,
  tiempoAproximado: String,
  tipoBracket: String,
  aparatoOrtopedico: String,
  observaciones: String,

  evoluciones: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvolucionOrtodoncia'
    }
  ],
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
  },
  archivo3: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
  }
})

ortodonciaSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Ortodoncia = mongoose.model('Ortodoncia', ortodonciaSchema)

module.exports = Ortodoncia

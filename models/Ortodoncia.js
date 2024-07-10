const mongoose = require('mongoose')

const ortodonciaSchema = new mongoose.Schema({
  diagnosticoOrtodoncia: {
    type: String
  },
  objetivoOrtodoncia: String,
  tiempoAproximadoOrtodoncia: String,
  diagnosticoOrtopedia: String,
  objetivoOrtopedia: String,
  tiempoAproximadoOrtopedia: String,

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

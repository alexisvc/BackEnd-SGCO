const mongoose = require('mongoose')

const consentimientoSchema = new mongoose.Schema({
  archivo: {
    type: String, // Ruta o nombre del archivo guardado
    required: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true // Asegura que cada paciente tenga un único consentimiento
  }
})

consentimientoSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Consentimiento = mongoose.model('Consentimiento', consentimientoSchema)

module.exports = Consentimiento

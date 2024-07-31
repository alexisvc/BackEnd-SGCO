const mongoose = require('mongoose')

const disfuncionMandibularSchema = new mongoose.Schema({
  huesoCortical: [String],
  espacioArticular: [String],
  condillo: [String],
  desviacionLineaMedia: [String],
  desplazamientoLineaMedia: String,
  conReduccion: [String],
  sinReduccion: [String],
  clickArticular: [String],
  crepitacion: [String],
  subluxacion: [String],
  dolorArticularDer: [String],
  dolorArticularIzq: [String],
  dolorMuscularIzq: [String],
  dolorMuscularDer: [String],
  dolorMuscular: [String],
  dolorMuscularDescripcion: {
    type: String,
    trim: true
  },
  dolorOrofacialComunMuscular: [String],
  otroDolorOrofacialComunMuscular: String,
  mallampati: [String],
  dolorOrofacialComunApnea: [String],
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  }
})

disfuncionMandibularSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const DisfuncionMandibular = mongoose.model('DisfuncionMandibular', disfuncionMandibularSchema)

module.exports = DisfuncionMandibular

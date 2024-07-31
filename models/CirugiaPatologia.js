// models/CirugiaPatologia.js

const mongoose = require('mongoose')

const cirugiaPatologiaSchema = new mongoose.Schema({
  antecedentesCirPat: {
    type: String
  },
  alergiasMedCirPat: {
    type: String
  },
  patologiaTejBland: {
    type: String
  },
  patologiaTejDuros: {
    type: String
  },
  diagRadiografico: {
    type: String
  },
  localizacionPatologia: {
    type: String
  },
  extraccionDental: {
    type: String
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  archivo1: {
    type: String
  },
  archivo2: {
    type: String // Puede ser opcional
  }
})

cirugiaPatologiaSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const CirugiaPatologia = mongoose.model('CirugiaPatologia', cirugiaPatologiaSchema)

module.exports = CirugiaPatologia

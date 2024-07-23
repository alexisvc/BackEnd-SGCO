const mongoose = require('mongoose')

const cirugiaPatologiaSchema = new mongoose.Schema({
  antecedentesCirPat: {
    type: String,
    required: true
  },
  alergiasMedCirPat: {
    type: String,
    required: true
  },
  patologiaTejBland: {
    type: String,
    required: true
  },
  patologiaTejDuros: {
    type: String,
    required: true
  },
  diagRadiografico: {
    type: String,
    required: true
  },
  localizacionPatologia: {
    type: String,
    required: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true // Ensure unique reference per patient
  },
  archivo: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
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

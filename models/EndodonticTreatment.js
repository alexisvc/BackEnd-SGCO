const mongoose = require('mongoose')

const endodonticTreatmentSchema = new mongoose.Schema({
  dienteEnd: {
    type: String,
    trim: true
  },
  grapaEnd: {
    type: String,
    trim: true
  },
  diagDental: {
    type: String,
    trim: true
  },
  diagPulpar: {
    type: String,
    trim: true
  },
  intervencionIndicada: {
    type: String,
    trim: true
  },
  tecnicaObturacion: {
    type: String,
    trim: true
  },
  numConductos: {
    type: String,
    trim: true
  },
  obsAnatomicas: {
    type: String,
    trim: true
  },
  etiologia: [String],
  dolor: [String],
  pruebasClinicas: [String],
  pruebasVitalidad: [String],
  camaraPulpar: [String],
  conductosRadiculares: [String],
  foramen: [String],
  ligamentoPeriodontal: [String],
  otrosHallazgos: {
    type: String,
    trim: true
  },
  conductometriaTentativa: {
    type: String
  },
  conductometriaDefinitiva: {
    type: String
  },
  tecnicaInstrumentacion: {
    type: String,
    trim: true
  },
  medicacionIntra: {
    type: String,
    trim: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
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

endodonticTreatmentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const EndodonticTreatment = mongoose.model('EndodonticTreatment', endodonticTreatmentSchema)

module.exports = EndodonticTreatment

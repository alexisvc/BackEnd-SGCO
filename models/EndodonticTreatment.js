const mongoose = require('mongoose');

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
  etiologia: {
    type: Boolean
  },
  dolor: {
    type: Boolean
  },
  pruebasClinicas: {
    type: Boolean
  },
  pruebasVitalidad: {
    type: Boolean
  },
  camaraPulpar: {
    type: Boolean
  },
  conductosRadiculares: {
    type: Boolean
  },
  foramen: {
    type: Boolean
  },
  ligamentoPeriodontal: {
    type: Boolean
  },
  otrosHallazgos: {
    type: String,
    trim: true
  },
  conductometriaTentativa: {
    type: Number,
    min: 0
  },
  conductometriaDefinitiva: {
    type: Number,
    min: 0
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
    unique: true
  }
});

endodonticTreatmentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const EndodonticTreatment = mongoose.model('EndodonticTreatment', endodonticTreatmentSchema);

module.exports = EndodonticTreatment;

const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({
  nombrePaciente: {
    type: String,
    required: true
  },
  edadPaciente: {
    type: Number,
    required: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  correoPaciente: {
    type: String,
    required: true
  },
  direccionPaciente: {
    type: String,
    required: true
  },
  generoPaciente: {
    type: String,
    required: true
  },
  numeroCedula: {
    type: String,
    required: true,
    unique: true
  },
  ocupacion: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  telContactoEmergencia: {
    type: String,
    required: true
  },
  afinidadContactoEmergencia: {
    type: String,
    required: true
  },
  historiaClinica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  treatmentPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentPlan'
  }],
  evolutionCharts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EvolutionChart'
  }],
  endodoncia: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EndodonticTreatment'
  }],
  cirugiaPatologia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CirugiaPatologia'
  },
  periodoncia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Periodoncia'
  },
  ortodoncia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ortodoncia'
  }
})

patientSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Patient = mongoose.model('Patient', patientSchema)

module.exports = Patient

const mongoose = require('mongoose')

const medicalRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true // Asegura que cada paciente tenga una única historia clínica
  },
  motivoConsulta: String,
  expectativaPaciente: String,
  enfermedadSistemica: String,
  enfermedadPreexistente: String,
  medicoTratante: String,
  telMedicoTratante: String,
  medicamentosConsume: String,
  alergiaMedicamentos: String,
  habitosNocivos: [String],
  enfermedadesRespiratorias: String,
  enfermedadesHormonales: String,
  estaGestando: Boolean,
  mesGestacion: String,
  esMenorEdad: Boolean,
  nombreRepresentante: String,
  telRepresentante: String,
  ultimaVisitaDentista: String,
  infiltracionesAnestesiaPrev: Boolean,
  reaccionesAdversasInfiltracion: Boolean,
  queReaccionInfiltracion: String,
  exodonciaCirugiaPrevias: Boolean,
  complicacionesLuegoCirugias: Boolean,
  queComplicacionesCirugias: String,
  presentaDificultades: [String],
  otraDificultad: String,
  presenta: [String],
  estadoLengua: String,
  estadoLabios: String,
  estadoCarillos: String,
  estadoPisoBoca: String,
  estadoGingivoPerio: String,
  estadoEnfermedadPerio: String,
  analisisOclusalDerRM: String,
  analisisOclusalDerRC: String,
  analisisOclusalIzqRM: String,
  analisisOclusalIzqRC: String,
  condicionEsqueletal: String,
  diagnosticoOclusal: String
})

medicalRecordSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema)

module.exports = MedicalRecord

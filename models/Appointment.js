const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  odontologo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Odontologo',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  horaInicio: {
    type: String,
    required: true
  },
  horaFin: {
    type: String,
    required: true
  },
  duracion: {
    type: Number,
    default: 15 // Cada cita dura 15 minutos por defecto
  },
  comentario: {
    type: String
  }
})

appointmentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Appointment = mongoose.model('Appointment', appointmentSchema)

module.exports = Appointment

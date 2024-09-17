const mongoose = require('mongoose')

const odontologoSchema = new mongoose.Schema({
  nombreOdontologo: {
    type: String,
    required: true
  },
  edadOdontologo: {
    type: Number,
    required: true
  },
  correoOdontologo: {
    type: String,
    required: true,
    unique: true
  },
  direccionOdontologo: {
    type: String,
    required: true
  },
  generoOdontologo: {
    type: String,
    required: true
  },
  especialidad: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  fechaIngreso: {
    type: Date,
    default: Date.now
  }
})

odontologoSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Odontologo = mongoose.model('Odontologo', odontologoSchema)

module.exports = Odontologo

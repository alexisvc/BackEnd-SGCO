const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  medicalRecords: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord'
    }
  ]
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

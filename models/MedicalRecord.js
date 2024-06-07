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
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  }
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

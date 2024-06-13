const mongoose = require('mongoose')

const treatmentPlanSchema = new mongoose.Schema({
  cita: {
    type: String,
    required: true,
    trim: true
  },
  actividadPlanTrat: {
    type: String,
    required: true,
    trim: true
  },
  fechaPlanTrat: {
    type: Date,
    required: true
  },
  montoAbono: {
    type: Number,
    required: true,
    min: 0
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  }
})

treatmentPlanSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const TreatmentPlan = mongoose.model('TreatmentPlan', treatmentPlanSchema)

module.exports = TreatmentPlan

const mongoose = require('mongoose')

const contractPlanSchema = new mongoose.Schema({
  treatmentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentPlan',
    required: true,
    unique: true
  },
  contractFile: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ContractPlan', contractPlanSchema)

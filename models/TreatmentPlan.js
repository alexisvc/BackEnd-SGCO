const mongoose = require('mongoose')

const treatmentPlanSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  especialidad: {  
    type: String,
    required: true
  },
  actividades: [{
    cita: {
      type: String,
      required: true
    },
    actividadPlanTrat: {
      type: String,
      required: true
    },
    fechaPlanTrat: {
      type: Date,
      required: true
    },
    montoAbono: {
      type: Number,
      default: 0
    },
    estado: {
      type: String,
      enum: ['pendiente', 'en-proceso', 'completado'],
      default: 'pendiente'
    }
  }]
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
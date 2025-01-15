const mongoose = require('mongoose')

const evolucionOrtodonciaSchema = new mongoose.Schema({
  fechaEvolucion: {
    type: Date,
    required: true
  },
  evolucion: {
    type: String,
    required: true
  },
  arcoEvolucion: {
    type: String,
    required: true
  },
  ortodoncia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ortodoncia',
    required: true
    // unique: true
  }
})

evolucionOrtodonciaSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const EvolucionOrtodoncia = mongoose.model(
  'EvolucionOrtodoncia',
  evolucionOrtodonciaSchema
)

module.exports = EvolucionOrtodoncia

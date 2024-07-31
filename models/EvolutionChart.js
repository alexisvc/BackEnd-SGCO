const mongoose = require('mongoose')

const evolutionChartSchema = new mongoose.Schema({
  fechaCuadEvol: {
    type: Date,
    required: true
  },
  actividadCuadEvol: {
    type: String,
    required: true
  },
  recomendacionCuadEvol: {
    type: String,
    required: true
  },
  archivo1: {
    type: String
  },
  archivo2: {
    type: String
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  }
})

evolutionChartSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const EvolutionChart = mongoose.model('EvolutionChart', evolutionChartSchema)

module.exports = EvolutionChart

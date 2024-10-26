// models/Budget.js
const mongoose = require('mongoose')

// Esquema para las fases
const faseSchema = new mongoose.Schema({
  nombreFase: {
    type: String,
    required: [true, 'El nombre de la fase es requerido']
  },
  totalFase: {
    type: Number,
    required: [true, 'El valor de la fase es requerido'],
    min: [0, 'El valor no puede ser negativo']
  }
})

// Esquema para los procedimientos
const procedimientoSchema = new mongoose.Schema({
  nombreProcedimiento: {
    type: String,
    required: [true, 'El nombre del procedimiento es requerido']
  },
  fases: [faseSchema],
  totalProcedimiento: {
    type: Number,
    default: 0
  }
})

// Esquema principal del presupuesto
const budgetSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'El paciente es requerido']
  },
  procedimientos: [procedimientoSchema],
  totalPresupuesto: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Middleware para calcular totales automáticamente
budgetSchema.pre('save', function(next) {
  // Calcular total de cada procedimiento
  this.procedimientos.forEach(procedimiento => {
    procedimiento.totalProcedimiento = procedimiento.fases.reduce(
      (total, fase) => total + fase.totalFase, 
      0
    )
  })
  
  // Calcular total del presupuesto
  this.totalPresupuesto = this.procedimientos.reduce(
    (total, procedimiento) => total + procedimiento.totalProcedimiento, 
    0
  )
  
  next()
})

// Configuración del modelo
budgetSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Budget = mongoose.model('Budget', budgetSchema)

module.exports = Budget
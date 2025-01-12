const mongoose = require('mongoose')

const procedimientoSchema = new mongoose.Schema({
  numeroPiezas: {
    type: Number,
    required: true,
    min: 1
  },
  nombre: {
    type: String,
    required: true
  },
  costoPorUnidad: {
    type: Number,
    required: true,
    min: 0
  },
  costoTotal: {
    type: Number
    // Se calculará automáticamente
  }
})

const faseSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String
  },
  procedimientos: [procedimientoSchema],
  total: {
    type: Number,
    default: 0
    // Se calculará automáticamente
  },
  estadoPago: {
    type: String,
    enum: ['pendiente', 'parcial', 'completado'],
    default: 'pendiente'
  }
})

const budgetSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  treatmentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentPlan'
    // required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  especialidad: {
    type: String,
    required: true
  },
  fases: [faseSchema],
  totalGeneral: {
    type: Number,
    default: 0
    // Se calculará automáticamente
  },
  totalGeneral: {
    type: Number,
    default: 0
  },
  totalPagado: {
    type: Number,
    default: 0
  },
  saldoPendienteTotal: {
    type: Number,
    default: function () {
      return this.totalGeneral
    }
  },
  estadoPagoGeneral: {
    type: String,
    enum: ['pendiente', 'parcial', 'completado'],
    default: 'pendiente'
  }
}, {
  timestamps: true
})

// Middleware para calcular los totales antes de guardar
budgetSchema.pre('save', function (next) {
  // Calcular costoTotal para cada procedimiento
  this.fases.forEach(fase => {
    fase.procedimientos.forEach(procedimiento => {
      procedimiento.costoTotal = procedimiento.numeroPiezas * procedimiento.costoPorUnidad
    })

    // Calcular total de la fase
    fase.total = fase.procedimientos.reduce((sum, proc) => sum + proc.costoTotal, 0)
  })

  // Calcular total general
  this.totalGeneral = this.fases.reduce((sum, fase) => sum + fase.total, 0)

  if (this.treatmentPlan) {
    const treatment = mongoose.model('TreatmentPlan').findById(this.treatmentPlan)
    if (!treatment) {
      throw new Error('Planificación no encontrada')
    }
  }

  next()
})

// Añadir método para actualizar pagos
budgetSchema.methods.actualizarPagosFase = async function (faseIndex, montoPago) {
  const fase = this.fases[faseIndex]

  // Actualizar la fase específica
  fase.totalPagado = (fase.totalPagado || 0) + montoPago
  fase.saldoPendiente = fase.total - fase.totalPagado
  fase.estadoPago = fase.totalPagado === 0
    ? 'pendiente'
    : fase.totalPagado >= fase.total ? 'completado' : 'parcial'

  // Actualizar totales generales
  const totalPagadoGeneral = this.fases.reduce((sum, f) => sum + (f.totalPagado || 0), 0)
  this.totalPagado = totalPagadoGeneral
  this.saldoPendienteTotal = this.totalGeneral - totalPagadoGeneral
  this.estadoPagoGeneral = totalPagadoGeneral === 0
    ? 'pendiente'
    : totalPagadoGeneral >= this.totalGeneral ? 'completado' : 'parcial'

  return this.save()
}

const Budget = mongoose.model('Budget', budgetSchema)

module.exports = Budget

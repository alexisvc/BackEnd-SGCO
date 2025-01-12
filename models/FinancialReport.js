const mongoose = require('mongoose')

const financialReportSchema = new mongoose.Schema({
  presupuesto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'cheque'],
    required: true
  },
  conceptoPago: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
})

// Índices
financialReportSchema.index({ fecha: 1 })

// Método para reporte mensual general
financialReportSchema.statics.reporteMensual = async function (mes, año) {
  const inicioMes = new Date(año, mes - 1, 1)
  const finMes = new Date(año, mes, 0)

  return this.aggregate([
    {
      $match: {
        fecha: { $gte: inicioMes, $lte: finMes }
      }
    },
    {
      $group: {
        _id: '$metodoPago',
        totalMonto: { $sum: '$monto' },
        cantidadTransacciones: { $sum: 1 }
      }
    }
  ])
}

// Método para reporte anual
financialReportSchema.statics.reporteAnual = async function (año) {
  const inicioAño = new Date(año, 0, 1)
  const finAño = new Date(año, 11, 31)

  return this.aggregate([
    {
      $match: {
        fecha: { $gte: inicioAño, $lte: finAño }
      }
    },
    {
      $group: {
        _id: {
          mes: { $month: '$fecha' },
          metodoPago: '$metodoPago'
        },
        totalMonto: { $sum: '$monto' }
      }
    },
    {
      $sort: {
        '_id.mes': 1,
        '_id.metodoPago': 1
      }
    }
  ])
}

const FinancialReport = mongoose.model('FinancialReport', financialReportSchema)

module.exports = FinancialReport

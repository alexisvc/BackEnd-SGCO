const mongoose = require('mongoose')

const pagoSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true,
    trim: true
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
  saldo: {
    type: Number,
    min: 0
  },
  metodoPago: {
    type: String,
    required: true,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'cheque']
  },
  comprobante: {
    numero: String,
    tipo: {
      type: String,
      enum: ['factura', 'recibo', 'otro']
    }
  },
  anulado: {
    type: Boolean,
    default: false
  },
  fechaAnulacion: Date,
  motivoAnulacion: String
})

const paymentFaseSchema = new mongoose.Schema({
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  faseIndex: {
    type: Number,
    required: true,
    min: 0
  },
  nombreFase: {
    type: String,
    required: true
  },
  totalFase: {
    type: Number,
    required: true,
    min: 0
  },
  pagos: [pagoSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtuals para cálculos
paymentFaseSchema.virtual('totalPagado').get(function () {
  return this.pagos
    .filter(pago => !pago.anulado)
    .reduce((sum, pago) => sum + pago.monto, 0)
})

paymentFaseSchema.virtual('saldoPendiente').get(function () {
  return this.totalFase - this.totalPagado
})

paymentFaseSchema.virtual('estadoPago').get(function () {
  if (this.totalPagado === 0) return 'pendiente'
  if (this.totalPagado >= this.totalFase) return 'completado'
  return 'parcial'
})

// Método para registrar nuevo pago

paymentFaseSchema.methods.registrarPago = function (datosPago) {
  const totalPagadoActual = this.pagos
    .filter(p => !p.anulado)
    .reduce((sum, p) => sum + p.monto, 0)

  if (totalPagadoActual + datosPago.monto > this.totalFase) {
    throw new Error('El pago excede el saldo pendiente de la fase')
  }

  const nuevoSaldo = this.totalFase - (totalPagadoActual + datosPago.monto)

  this.pagos.push({
    ...datosPago,
    saldo: nuevoSaldo
  })

  return this.save()
}

/*
paymentFaseSchema.methods.registrarPago = function(datosPago) {
    const montoTotal = this.pagos
      .filter(p => !p.anulado)
      .reduce((sum, p) => sum + p.monto, 0);

    if (montoTotal + datosPago.monto > this.totalFase) {
      throw new Error('El pago excede el saldo pendiente de la fase');
    }

    const saldoPendiente = this.totalFase - (montoTotal + datosPago.monto);

    this.pagos.push({
      ...datosPago,
      saldo: saldoPendiente
    });

    return this.save();
  };
*/
// Método para anular pago
paymentFaseSchema.methods.anularPago = function (pagoId, motivo) {
  const pago = this.pagos.id(pagoId)
  if (!pago) throw new Error('Pago no encontrado')
  if (pago.anulado) throw new Error('El pago ya está anulado')

  pago.anulado = true
  pago.fechaAnulacion = new Date()
  pago.motivoAnulacion = motivo

  return this.save()
}

// Método estático para crear fase de pago inicial
paymentFaseSchema.statics.initializeForBudgetPhase = async function (budget, faseIndex) {
  if (!budget.fases[faseIndex]) {
    throw new Error('Fase no encontrada')
  }

  const fase = budget.fases[faseIndex]
  return this.create({
    budget: budget._id,
    faseIndex,
    nombreFase: fase.nombre,
    totalFase: fase.total,
    pagos: []
  })
}

paymentFaseSchema.methods.initializeForBudgetPhase = async function (budget, faseIndex) {
  this.budget = budget._id
  this.faseIndex = faseIndex
  this.nombreFase = budget.fases[faseIndex].nombre
  this.totalFase = budget.fases[faseIndex].total
  await this.save()
  return this
}

const Payment = mongoose.model('Payment', paymentFaseSchema)

module.exports = Payment

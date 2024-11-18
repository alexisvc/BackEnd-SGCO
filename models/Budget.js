const mongoose = require('mongoose');

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
    type: Number,
    // Se calculará automáticamente
  }
});

const faseSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  procedimientos: [procedimientoSchema],
  total: {
    type: Number,
    default: 0
    // Se calculará automáticamente
  }
});

const budgetSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
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
  estado: {
    type: String,
    enum: ['borrador', 'emitido', 'aceptado', 'rechazado'],
    default: 'borrador'
  }
}, {
  timestamps: true
});

// Middleware para calcular los totales antes de guardar
budgetSchema.pre('save', function(next) {
  // Calcular costoTotal para cada procedimiento
  this.fases.forEach(fase => {
    fase.procedimientos.forEach(procedimiento => {
      procedimiento.costoTotal = procedimiento.numeroPiezas * procedimiento.costoPorUnidad;
    });

    // Calcular total de la fase
    fase.total = fase.procedimientos.reduce((sum, proc) => sum + proc.costoTotal, 0);
  });

  // Calcular total general
  this.totalGeneral = this.fases.reduce((sum, fase) => sum + fase.total, 0);

  next();
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
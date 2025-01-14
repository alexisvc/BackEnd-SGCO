const paymentsRouter = require('express').Router()
const { body, param, validationResult } = require('express-validator')
const Payment = require('../models/Payment')
const Budget = require('../models/Budget')
const FinancialReport = require('../models/FinancialReport')
const TreatmentPlan = require('../models/TreatmentPlan')
const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
paymentsRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de pagos
const validatePaymentData = [
  param('budgetId').isMongoId().withMessage('El ID del presupuesto debe ser un ID válido de MongoDB'),
  param('faseIndex').isInt({ min: 0 }).withMessage('El índice de la fase debe ser un número entero no negativo'),
  body('descripcion').isString().trim().escape().notEmpty().withMessage('La descripción es obligatoria y debe ser un texto válido'),
  body('monto').isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  body('metodoPago').isString().trim().escape().notEmpty().withMessage('El método de pago es obligatorio y debe ser un texto válido')
]

const validateAnularPaymentData = [
  param('budgetId').isMongoId().withMessage('El ID del presupuesto debe ser un ID válido de MongoDB'),
  param('faseIndex').isInt({ min: 0 }).withMessage('El índice de la fase debe ser un número entero no negativo'),
  param('pagoId').isMongoId().withMessage('El ID del pago debe ser un ID válido de MongoDB'),
  body('motivo').isString().trim().escape().notEmpty().withMessage('El motivo de anulación es obligatorio y debe ser un texto válido')
]

// Obtener todos los pagos de un presupuesto con resumen
paymentsRouter.get('/budget/:budgetId/summary', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    // Inicializar las fases del resumen basado en el presupuesto
    const resumenFases = budget.fases.map((fase, index) => {
      return {
        faseIndex: index,
        nombreFase: fase.nombre,
        totalFase: fase.total,
        totalPagado: 0, // Se actualizará con los pagos reales
        saldoPendiente: fase.total,
        pagos: []
      }
    })

    // Obtener los pagos existentes
    const paymentPhases = await Payment.find({ budget: req.params.budgetId })
      .sort('faseIndex')

    // Actualizar las fases con los pagos existentes
    paymentPhases.forEach(paymentPhase => {
      if (resumenFases[paymentPhase.faseIndex]) {
        const totalPagado = paymentPhase.pagos
          .filter(pago => !pago.anulado)
          .reduce((sum, pago) => sum + pago.monto, 0)

        resumenFases[paymentPhase.faseIndex].totalPagado = totalPagado
        resumenFases[paymentPhase.faseIndex].saldoPendiente =
            resumenFases[paymentPhase.faseIndex].totalFase - totalPagado
        resumenFases[paymentPhase.faseIndex].pagos = paymentPhase.pagos
          .map(pago => ({
            _id: pago._id,
            descripcion: pago.descripcion,
            fecha: pago.fecha,
            monto: pago.monto,
            saldo: pago.saldo,
            metodoPago: pago.metodoPago,
            anulado: pago.anulado
          }))
      }
    })

    const resumenGeneral = {
      totalPresupuesto: budget.totalGeneral,
      totalPagado: resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0),
      saldoPendiente: budget.totalGeneral - resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0),
      porcentajePagado: (resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0) / budget.totalGeneral) * 100,
      estadoPago: calcularEstadoPago(
        budget.totalGeneral,
        resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0)
      )
    }

    function calcularEstadoPago (total, pagado) {
      if (pagado === 0) return 'pendiente'
      if (pagado >= total) return 'completado'
      return 'parcial'
    }

    res.json({
      resumenGeneral,
      fases: resumenFases
    })
  } catch (error) {
    console.error('Error al obtener resumen de pagos:', error)
    res.status(500).json({ error: 'Error al obtener el resumen de pagos' })
  }
})

paymentsRouter.post('/budget/:budgetId/fase/:faseIndex/treatment/:treatmentId/pago', async (req, res) => {
  try {
    const { budgetId, faseIndex, treatmentId } = req.params
    const paymentData = req.body

    const budget = await Budget.findById(budgetId)
    const treatment = await TreatmentPlan.findById(treatmentId)

    if (!budget || !treatment) {
      return res.status(404).json({ error: 'Presupuesto o tratamiento no encontrado' })
    }

    let paymentPhase = await Payment.findOne({
      budget: budgetId,
      faseIndex: parseInt(faseIndex)
    })

    if (!paymentPhase) {
      paymentPhase = await Payment.initializeForBudgetPhase(budget, parseInt(faseIndex))
    }

    await paymentPhase.registrarPago({
      ...paymentData,
      tratamiento: treatmentId
    })

    // Actualizar el presupuesto
    await budget.actualizarPagosFase(parseInt(faseIndex), paymentData.monto)

    res.json(paymentPhase)
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el pago' })
  }
})

// Ruta para registrar un nuevo pago
paymentsRouter.post('/budget/:budgetId/fase/:faseIndex/pago', validatePaymentData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { descripcion, monto, metodoPago } = req.body
    const { budgetId, faseIndex } = req.params

    const budget = await Budget.findById(budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    let paymentPhase = await Payment.findOne({
      budget: budgetId,
      faseIndex: parseInt(faseIndex)
    })

    if (!paymentPhase) {
      paymentPhase = await Payment.initializeForBudgetPhase(budget, parseInt(faseIndex))
    }

    // Validar que el monto no exceda el saldo pendiente
    if (monto > paymentPhase.saldoPendiente) {
      return res.status(400).json({ error: 'El monto del pago excede el saldo pendiente' })
    }

    // Registrar el pago
    paymentPhase.pagos.push({
      descripcion,
      monto,
      metodoPago,
      fecha: new Date(),
      saldo: paymentPhase.saldoPendiente - monto
    })

    const updatedPaymentPhase = await paymentPhase.save()

    // Crear registro financiero
    const financialReport = new FinancialReport({
      presupuesto: budgetId,
      paciente: budget.paciente._id,
      monto,
      metodoPago,
      conceptoPago: `Pago de fase ${parseInt(faseIndex) + 1}: ${descripcion}`
    })

    await financialReport.save()

    // Actualizar el estado del presupuesto
    const allPayments = await Payment.find({ budget: budgetId })
    const totalPagado = allPayments.reduce((sum, phase) =>
      sum + phase.pagos.filter(p => !p.anulado)
        .reduce((pSum, pago) => pSum + pago.monto, 0), 0)

    budget.totalPagado = totalPagado
    budget.saldoPendienteTotal = budget.totalGeneral - totalPagado
    budget.estadoPagoGeneral = totalPagado === 0
      ? 'pendiente'
      : totalPagado >= budget.totalGeneral ? 'completado' : 'parcial'
    await budget.save()

    res.json(updatedPaymentPhase)
  } catch (error) {
    console.error('Error al registrar pago:', error)
    res.status(500).json({ error: 'Error al registrar el pago' })
  }
})

// Ruta para anular un pago
paymentsRouter.patch('/budget/:budgetId/fase/:faseIndex/pago/:pagoId/anular', validateAnularPaymentData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { budgetId, faseIndex, pagoId } = req.params
    const { motivo } = req.body

    const paymentPhase = await Payment.findOne({
      budget: budgetId,
      faseIndex: parseInt(faseIndex)
    })

    if (!paymentPhase) {
      return res.status(404).json({ error: 'Fase de pago no encontrada' })
    }

    const pago = paymentPhase.pagos.id(pagoId)
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    // Anular el registro financiero
    await FinancialReport.findOneAndDelete({
      presupuesto: budgetId,
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      fecha: pago.fecha
    })

    // Anular el pago
    pago.anulado = true
    pago.fechaAnulacion = new Date()
    pago.motivoAnulacion = motivo

    const updatedPaymentPhase = await paymentPhase.save()

    // Actualizar el presupuesto restando el pago anulado
    const budget = await Budget.findById(budgetId)
    await budget.actualizarPagosFase(parseInt(faseIndex), -pago.monto)

    res.json(updatedPaymentPhase)
  } catch (error) {
    console.error('Error al anular pago:', error)
    res.status(500).json({ error: 'Error al anular el pago' })
  }
})

// Eliminar todos los pagos de un presupuesto
paymentsRouter.delete('/budget/:budgetId/pagos', async (req, res) => {
  try {
    const { budgetId } = req.params

    // Verificar que existe el presupuesto
    const budget = await Budget.findById(budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    // Eliminar todos los registros financieros asociados
    await FinancialReport.deleteMany({ presupuesto: budgetId })

    // Eliminar todos los pagos
    await Payment.deleteMany({ budget: budgetId })

    // Actualizar el presupuesto
    budget.totalPagado = 0
    budget.saldoPendienteTotal = budget.totalGeneral
    budget.estadoPagoGeneral = 'pendiente'
    await budget.save()

    res.json({ message: 'Todos los pagos han sido eliminados exitosamente' })
  } catch (error) {
    console.error('Error al eliminar los pagos:', error)
    res.status(500).json({ error: 'Error al eliminar los pagos' })
  }
})

// Eliminar todos los pagos del sistema
paymentsRouter.delete('/deleteAll', async (req, res) => {
  try {
    // Eliminar la colección de pagos
    await Payment.collection.drop()

    // Eliminar todos los registros financieros relacionados
    await FinancialReport.collection.drop()

    res.json({
      message: 'Todas las colecciones de pagos han sido eliminadas exitosamente'
    })
  } catch (error) {
    console.error('Error al eliminar las colecciones:', error)
    res.status(500).json({
      error: 'Error al eliminar las colecciones',
      detalles: error.message
    })
  }
})

module.exports = paymentsRouter

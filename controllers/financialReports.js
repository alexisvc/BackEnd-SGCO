const financialReportsRouter = require('express').Router()
const { body, validationResult } = require('express-validator')
const FinancialReport = require('../models/FinancialReport')
const Budget = require('../models/Budget')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
financialReportsRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de reportes financieros
const validateFinancialReportData = [
  body('presupuesto').isMongoId().withMessage('El ID del presupuesto debe ser un ID válido de MongoDB'),
  body('monto').isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  body('metodoPago').isString().trim().escape().withMessage('El método de pago es obligatorio y debe ser un texto válido'),
  body('conceptoPago').optional().isString().trim().escape().withMessage('El concepto de pago debe ser un texto válido')
]

// Obtener todos los reportes financieros
financialReportsRouter.get('/', async (req, res) => {
  try {
    const reports = await FinancialReport.find()
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('presupuesto', 'fecha especialidad totalGeneral')
    res.json(reports)
  } catch (error) {
    console.error('Error al obtener reportes:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Obtener reporte mensual
financialReportsRouter.get('/mensual', async (req, res) => {
  try {
    const { mes, año } = req.query

    if (!mes || !año) {
      return res.status(400).json({ error: 'Mes y año son requeridos' })
    }

    const inicioMes = new Date(año, mes - 1, 1)
    const finMes = new Date(año, mes, 0)

    // Obtener todos los reportes del mes con la información del paciente
    const reportes = await FinancialReport.find({
      fecha: {
        $gte: inicioMes,
        $lte: finMes
      }
    })
      .populate('paciente', 'nombrePaciente numeroCedula')

    // Agrupar por método de pago
    const reporte = Object.values(reportes.reduce((acc, report) => {
      if (!acc[report.metodoPago]) {
        acc[report.metodoPago] = {
          _id: report.metodoPago,
          totalMonto: 0,
          cantidadTransacciones: 0,
          transacciones: []
        }
      }
      acc[report.metodoPago].totalMonto += report.monto
      acc[report.metodoPago].cantidadTransacciones += 1
      acc[report.metodoPago].transacciones.push({
        fecha: report.fecha,
        monto: report.monto,
        paciente: report.paciente,
        conceptoPago: report.conceptoPago
      })
      return acc
    }, {}))

    const totalMensual = reportes.reduce((sum, report) => sum + report.monto, 0)

    res.json({
      reporte,
      totalMensual,
      mes,
      año
    })
  } catch (error) {
    console.error('Error al generar reporte mensual:', error)
    res.status(500).json({ error: 'Error al generar reporte mensual' })
  }
})

// Obtener reporte anual
financialReportsRouter.get('/anual', async (req, res) => {
  try {
    const { año } = req.query

    if (!año) {
      return res.status(400).json({ error: 'Año es requerido' })
    }

    const reporte = await FinancialReport.reporteAnual(parseInt(año))

    const totalAnual = reporte.reduce((sum, item) => sum + item.totalMonto, 0)

    res.json({
      reporte,
      totalAnual,
      año
    })
  } catch (error) {
    console.error('Error al generar reporte anual:', error)
    res.status(500).json({ error: 'Error al generar reporte anual' })
  }
})

// Obtener reporte por rango de fechas
financialReportsRouter.get('/rango', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Fechas de inicio y fin son requeridas' })
    }

    const reports = await FinancialReport.find({
      fecha: {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      }
    }).populate('paciente', 'nombrePaciente numeroCedula')

    const totalPeriodo = reports.reduce((sum, report) => sum + report.monto, 0)

    const resumenMetodosPago = reports.reduce((acc, report) => {
      acc[report.metodoPago] = (acc[report.metodoPago] || 0) + report.monto
      return acc
    }, {})

    res.json({
      reports,
      totalPeriodo,
      resumenMetodosPago,
      fechaInicio,
      fechaFin
    })
  } catch (error) {
    console.error('Error al generar reporte por rango:', error)
    res.status(500).json({ error: 'Error al generar reporte por rango' })
  }
})

// Ruta para registrar un nuevo ingreso
financialReportsRouter.post('/', validateFinancialReportData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { presupuesto, monto, metodoPago, conceptoPago } = req.body

    const budgetExists = await Budget.findById(presupuesto)
    if (!budgetExists) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const newReport = new FinancialReport({
      presupuesto,
      paciente: budgetExists.paciente,
      monto,
      metodoPago,
      conceptoPago,
      fecha: new Date()
    })

    const savedReport = await newReport.save()

    const populatedReport = await FinancialReport.findById(savedReport._id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('presupuesto', 'fecha especialidad totalGeneral')

    res.status(201).json(populatedReport)
  } catch (error) {
    console.error('Error al crear reporte financiero:', error)
    res.status(500).json({ error: 'Error al crear reporte financiero' })
  }
})

// Eliminar un reporte financiero
financialReportsRouter.delete('/:id', async (req, res) => {
  try {
    const reportId = req.params.id

    const deletedReport = await FinancialReport.findByIdAndDelete(reportId)

    if (!deletedReport) {
      return res.status(404).json({ error: 'Reporte financiero no encontrado' })
    }

    // Devolver 204 (No Content) para indicar eliminación exitosa
    res.status(204).end()
  } catch (error) {
    console.error('Error al eliminar reporte financiero:', error)
    res.status(500).json({
      error: 'Error al eliminar el reporte financiero',
      details: error.message
    })
  }
})

module.exports = financialReportsRouter

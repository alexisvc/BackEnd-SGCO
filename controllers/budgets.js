const budgetsRouter = require('express').Router()
const { body, validationResult } = require('express-validator')
const Budget = require('../models/Budget')
const TreatmentPlan = require('../models/TreatmentPlan')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Middleware para validar y sanitizar los datos del presupuesto
const validateBudgetData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('especialidad').isString().trim().escape().withMessage('La especialidad es obligatoria y debe ser un texto válido'),
  body('fases').isArray({ min: 1 }).withMessage('Debe incluir al menos una fase'),
  body('fases.*.nombre').isString().trim().escape().withMessage('El nombre de la fase es obligatorio y debe ser un texto válido'),
  body('fases.*.descripcion').optional().isString().trim().escape().withMessage('La descripción debe ser un texto válido'),
  body('fases.*.procedimientos').isArray({ min: 1 }).withMessage('Cada fase debe contener al menos un procedimiento'),
  body('fases.*.procedimientos.*.nombre').isString().trim().escape().withMessage('El nombre del procedimiento es obligatorio y debe ser un texto válido'),
  body('fases.*.procedimientos.*.numeroPiezas').isInt({ gt: 0 }).withMessage('El número de piezas debe ser un entero positivo'),
  body('fases.*.procedimientos.*.costoPorUnidad').isFloat({ min: 0 }).withMessage('El costo por unidad debe ser un número positivo'),
  body('treatmentPlan').optional().isMongoId().withMessage('El ID del plan de tratamiento debe ser un ID válido de MongoDB')
]

// Aplica el middleware a todas las rutas
budgetsRouter.use(authMiddleware)

// Obtener todos los presupuestos
budgetsRouter.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')
    res.json(budgets)
  } catch (error) {
    console.error('Error al obtener presupuestos:', error)
    res.status(500).json({ error: 'Error al obtener los presupuestos' })
  }
})

// Obtener presupuestos por paciente
budgetsRouter.get('/paciente/:pacienteId', async (req, res) => {
  try {
    const budgets = await Budget.find({ paciente: req.params.pacienteId })
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')
    if (!budgets.length) {
      return res.status(404).json({ error: 'No se encontraron presupuestos para este paciente' })
    }

    res.json(budgets)
  } catch (error) {
    console.error('Error al obtener presupuestos del paciente:', error)
    res.status(500).json({ error: 'Error al obtener los presupuestos del paciente' })
  }
})

// Obtener un presupuesto específico
budgetsRouter.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')
    console.log('Found budget:', budget)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    res.json(budget)
  } catch (error) {
    console.error('Error al obtener presupuesto:', error)
    res.status(500).json({ error: 'Error al obtener el presupuesto' })
  }
})

// Nueva ruta para obtener presupuesto por planificación
budgetsRouter.get('/treatment/:treatmentPlanId', async (req, res) => {
  try {
    const budget = await Budget.findOne({ treatmentPlan: req.params.treatmentPlanId })
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado para esta planificación' })
    }

    res.json(budget)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el presupuesto' })
  }
})

// Ruta para crear un nuevo presupuesto
budgetsRouter.post('/', validateBudgetData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, especialidad, fases, treatmentPlan } = req.body

    // Verificar si ya existe un presupuesto para el plan de tratamiento
    if (treatmentPlan) {
      const existingBudget = await Budget.findOne({ treatmentPlan })
      if (existingBudget) {
        return res.status(400).json({ error: 'Ya existe un presupuesto para esta planificación' })
      }
    }

    const newBudget = new Budget({ paciente, especialidad, fases, treatmentPlan })
    const savedBudget = await newBudget.save()

    // Si viene de una planificación, actualizar la planificación
    if (treatmentPlan) {
      const treatment = await TreatmentPlan.findById(treatmentPlan)
      if (!treatment) {
        return res.status(404).json({ error: 'Planificación no encontrada' })
      }
      treatment.budget = savedBudget._id
      await treatment.save()
    }

    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')

    res.status(201).json(populatedBudget)
  } catch (error) {
    console.error('Error al crear el presupuesto:', error)
    res.status(500).json({ error: 'Error al crear el presupuesto' })
  }
})

// Agregar un nuevo procedimiento a una fase
budgetsRouter.post('/:id/fase/:faseIndex/procedimiento', async (req, res) => {
  try {
    const { id, faseIndex } = req.params
    const nuevoProcedimiento = req.body

    const budget = await Budget.findById(id)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    if (faseIndex >= budget.fases.length) {
      return res.status(400).json({ error: 'Índice de fase inválido' })
    }

    budget.fases[faseIndex].procedimientos.push(nuevoProcedimiento)
    const updatedBudget = await budget.save()

    res.json(updatedBudget)
  } catch (error) {
    console.error('Error al agregar procedimiento:', error)
    res.status(500).json({ error: 'Error al agregar el procedimiento' })
  }
})

budgetsRouter.post('/treatment/:treatmentId', validateBudgetData, async (req, res) => {
  try {
    const { treatmentId } = req.params
    const budgetData = req.body

    const treatment = await TreatmentPlan.findById(treatmentId)
    if (!treatment) {
      return res.status(404).json({ error: 'Tratamiento no encontrado' })
    }

    const newBudget = new Budget({
      ...budgetData,
      paciente: treatment.paciente,
      treatmentPlan: treatmentId
    })

    const savedBudget = await newBudget.save()
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente')
      .populate('treatmentPlan')

    res.status(201).json(populatedBudget)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el presupuesto' })
  }
})

// Crear presupuesto desde una planificación
// Modificar la ruta de creación de presupuesto desde planificación
budgetsRouter.post('/from-treatment/:treatmentPlanId', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.treatmentPlanId)
      .populate('paciente')

    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    // Verificar si ya existe un presupuesto para esta planificación
    const existingBudget = await Budget.findOne({ treatmentPlan: treatment._id })
    if (existingBudget) {
      return res.status(400).json({ error: 'Ya existe un presupuesto para esta planificación' })
    }

    const budget = new Budget({
      paciente: treatment.paciente._id,
      especialidad: treatment.especialidad,
      treatmentPlan: treatment._id,
      fases: [{
        nombre: 'Fase Principal',
        descripcion: 'Actividades de la planificación',
        procedimientos: treatment.actividades.map(act => ({
          nombre: act.actividadPlanTrat,
          numeroPiezas: 1,
          costoPorUnidad: 0
        }))
      }]
    })

    const savedBudget = await budget.save()
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')

    res.status(201).json(populatedBudget)
  } catch (error) {
    console.error('Error al crear presupuesto desde planificación:', error)
    res.status(500).json({ error: 'Error al crear el presupuesto' })
  }
})

// Actualizar procedimientos de una fase específica
budgetsRouter.patch('/:id/fase/:faseIndex/procedimientos', async (req, res) => {
  try {
    const { id, faseIndex } = req.params
    const { procedimientos } = req.body

    const budget = await Budget.findById(id)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    if (faseIndex >= budget.fases.length) {
      return res.status(400).json({ error: 'Índice de fase inválido' })
    }

    budget.fases[faseIndex].procedimientos = procedimientos
    const updatedBudget = await budget.save()

    res.json(updatedBudget)
  } catch (error) {
    console.error('Error al actualizar procedimientos:', error)
    res.status(500).json({ error: 'Error al actualizar los procedimientos' })
  }
})

// Ruta para actualizar un presupuesto existente
budgetsRouter.put('/:id', validateBudgetData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { id } = req.params
    const budgetData = req.body

    const updatedBudget = await Budget.findByIdAndUpdate(
      id,
      budgetData,
      { new: true, runValidators: true }
    ).populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan')

    if (!updatedBudget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    res.json(updatedBudget)
  } catch (error) {
    console.error('Error al actualizar el presupuesto:', error)
    res.status(500).json({ error: 'Error al actualizar el presupuesto' })
  }
})

/// Eliminar un presupuesto

budgetsRouter.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    await Budget.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error)
    res.status(500).json({ error: 'Error al eliminar el presupuesto' })
  }
})

module.exports = budgetsRouter

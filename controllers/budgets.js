// controllers/budgets.js
const express = require('express')
const budgetsRouter = express.Router()
const Budget = require('../models/Budget')

// Obtener todos los presupuestos
budgetsRouter.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate('paciente', 'nombrePaciente numeroCedula')
    res.json(budgets)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener presupuestos' })
  }
})

// Obtener presupuestos por paciente
budgetsRouter.get('/paciente/:pacienteId', async (req, res) => {
  try {
    const budgets = await Budget.find({ paciente: req.params.pacienteId })
      .populate('paciente', 'nombrePaciente numeroCedula')
    res.json(budgets)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener presupuestos del paciente' })
  }
})

// Obtener un presupuesto específico
budgetsRouter.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('paciente', 'nombrePaciente numeroCedula')
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }
    res.json(budget)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el presupuesto' })
  }
})

// Obtener procedimientos de un presupuesto
budgetsRouter.get('/:id/procedimientos', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('paciente', 'nombrePaciente numeroCedula')
    
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    // Enviar solo los procedimientos del presupuesto
    res.json(budget.procedimientos)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener los procedimientos del presupuesto' })
  }
})

// Obtener un procedimiento específico
budgetsRouter.get('/:budgetId/procedimientos/:procedimientoId', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = budget.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    res.json(procedimiento)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener el procedimiento' })
  }
})

// Crear nuevo presupuesto
budgetsRouter.post('/', async (req, res) => {
  try {
    const { paciente, procedimientos } = req.body

    // Validaciones básicas
    if (!paciente) {
      return res.status(400).json({ error: 'Se requiere el paciente' })
    }

    const budget = new Budget({
      paciente,
      procedimientos: procedimientos || []
    })

    const savedBudget = await budget.save()
    res.status(201).json(savedBudget)
  } catch (error) {
    console.error('Error al crear presupuesto:', error)
    res.status(500).json({ error: 'Error al crear el presupuesto' })
  }
})

// Agregar procedimiento a un presupuesto
budgetsRouter.post('/:id/procedimientos', async (req, res) => {
  try {
    const { nombreProcedimiento } = req.body
    
    if (!nombreProcedimiento) {
      return res.status(400).json({ error: 'El nombre del procedimiento es requerido' })
    }

    const budget = await Budget.findById(req.params.id)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    budget.procedimientos.push({
      nombreProcedimiento,
      fases: []
    })

    const updatedBudget = await budget.save()
    res.json(updatedBudget)
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar procedimiento' })
  }
})

// Agregar fase a un procedimiento
budgetsRouter.post('/:budgetId/procedimientos/:procedimientoId/fases', async (req, res) => {
  try {
    const { nombreFase, totalFase } = req.body

    if (!nombreFase || totalFase === undefined) {
      return res.status(400).json({ error: 'Nombre y total de la fase son requeridos' })
    }

    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = budget.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    procedimiento.fases.push({
      nombreFase,
      totalFase
    })

    const updatedBudget = await budget.save()
    res.json(updatedBudget)
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar fase' })
  }
})

// Actualizar un procedimiento
budgetsRouter.put('/:budgetId/procedimientos/:procedimientoId', async (req, res) => {
  try {
    const { nombreProcedimiento } = req.body
    
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = budget.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    if (nombreProcedimiento) {
      procedimiento.nombreProcedimiento = nombreProcedimiento
    }

    const updatedBudget = await budget.save()
    res.json(updatedBudget)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar procedimiento' })
  }
})

// Actualizar una fase
budgetsRouter.put('/:budgetId/procedimientos/:procedimientoId/fases/:faseId', async (req, res) => {
  try {
    const { nombreFase, totalFase } = req.body
    
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = budget.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    const fase = procedimiento.fases.id(req.params.faseId)
    if (!fase) {
      return res.status(404).json({ error: 'Fase no encontrada' })
    }

    if (nombreFase) fase.nombreFase = nombreFase
    if (totalFase !== undefined) fase.totalFase = totalFase

    const updatedBudget = await budget.save()
    res.json(updatedBudget)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar fase' })
  }
})

// Eliminar un presupuesto
budgetsRouter.delete('/:id', async (req, res) => {
  try {
    const deletedBudget = await Budget.findByIdAndDelete(req.params.id)
    if (!deletedBudget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el presupuesto' })
  }
})

// Eliminar un procedimiento
budgetsRouter.delete('/:budgetId/procedimientos/:procedimientoId', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    budget.procedimientos.id(req.params.procedimientoId).remove()
    await budget.save()
    
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el procedimiento' })
  }
})

// Eliminar una fase
budgetsRouter.delete('/:budgetId/procedimientos/:procedimientoId/fases/:faseId', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.budgetId)
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = budget.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    procedimiento.fases.id(req.params.faseId).remove()
    await budget.save()
    
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la fase' })
  }
})

module.exports = budgetsRouter
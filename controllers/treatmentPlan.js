// controllers/treatmentPlans.js
const express = require('express')
const treatmentPlansRouter = express.Router()
const TreatmentPlan = require('../models/TreatmentPlan')
const Patient = require('../models/Patient')
const Budget = require('../models/Budget')

// Obtener todos los tratamientos
treatmentPlansRouter.get('/', async (req, res) => {
  try {
    const treatmentPlans = await TreatmentPlan.find()
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
      .populate('presupuesto')
    res.json(treatmentPlans)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener un tratamiento por ID
treatmentPlansRouter.get('/:id', async (req, res) => {
  try {
    const treatmentPlan = await TreatmentPlan.findById(req.params.id)
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
      .populate('presupuesto')
    
    if (!treatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' })
    }
    res.json(treatmentPlan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener tratamientos por paciente
treatmentPlansRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const treatments = await TreatmentPlan.find({ paciente: req.params.patientId })
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
      .populate('presupuesto')
    res.json(treatments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Crear nuevo tratamiento
treatmentPlansRouter.post('/', async (req, res) => {
  try {
    const { 
      cita, 
      actividadPlanTrat, 
      fechaPlanTrat, 
      montoAbono, 
      paciente,
      presupuesto,
      procedimiento,
      fase
    } = req.body

    // Validar que el paciente existe
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    // Validar que el presupuesto existe y pertenece al paciente
    const budget = await Budget.findById(presupuesto)
    if (!budget) {
      return res.status(400).json({ error: 'Budget not found' })
    }
    if (budget.paciente.toString() !== paciente) {
      return res.status(400).json({ error: 'Budget does not belong to this patient' })
    }

    // Validar que el procedimiento existe en el presupuesto
    const procedimientoExists = budget.procedimientos.id(procedimiento)
    if (!procedimientoExists) {
      return res.status(400).json({ error: 'Procedure not found in budget' })
    }

    // Validar que la fase existe en el procedimiento
    const faseExists = procedimientoExists.fases.id(fase)
    if (!faseExists) {
      return res.status(400).json({ error: 'Phase not found in procedure' })
    }

    const treatmentPlan = new TreatmentPlan({
      cita,
      actividadPlanTrat,
      fechaPlanTrat,
      montoAbono,
      paciente,
      presupuesto,
      procedimiento,
      fase
    })

    const savedTreatmentPlan = await treatmentPlan.save()

    // Agregar referencia al paciente
    existingPatient.treatmentPlans = existingPatient.treatmentPlans.concat(savedTreatmentPlan._id)
    await existingPatient.save()

    res.status(201).json(savedTreatmentPlan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Actualizar tratamiento
treatmentPlansRouter.put('/:id', async (req, res) => {
  try {
    const { 
      cita, 
      actividadPlanTrat, 
      fechaPlanTrat, 
      montoAbono, 
      presupuesto,
      procedimiento,
      fase 
    } = req.body

    // Si se está actualizando el presupuesto/procedimiento/fase, validar que existan
    if (presupuesto && procedimiento && fase) {
      const budget = await Budget.findById(presupuesto)
      if (!budget) {
        return res.status(400).json({ error: 'Budget not found' })
      }

      const procedimientoExists = budget.procedimientos.id(procedimiento)
      if (!procedimientoExists) {
        return res.status(400).json({ error: 'Procedure not found in budget' })
      }

      const faseExists = procedimientoExists.fases.id(fase)
      if (!faseExists) {
        return res.status(400).json({ error: 'Phase not found in procedure' })
      }
    }

    const updatedTreatmentPlan = await TreatmentPlan.findByIdAndUpdate(
      req.params.id,
      {
        cita,
        actividadPlanTrat,
        fechaPlanTrat,
        montoAbono,
        presupuesto,
        procedimiento,
        fase
      },
      { new: true, runValidators: true }
    )

    if (!updatedTreatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' })
    }

    res.json(updatedTreatmentPlan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Eliminar tratamiento
treatmentPlansRouter.delete('/:id', async (req, res) => {
  try {
    const treatmentPlan = await TreatmentPlan.findById(req.params.id)
    if (!treatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' })
    }

    const patient = await Patient.findById(treatmentPlan.paciente)
    if (patient) {
      patient.treatmentPlans = patient.treatmentPlans.filter(
        planId => planId.toString() !== req.params.id
      )
      await patient.save()
    }

    await TreatmentPlan.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = treatmentPlansRouter
const express = require('express')
const treatmentPlansRouter = express.Router()
const TreatmentPlan = require('../models/TreatmentPlan')
const Patient = require('../models/Patient')

// Route to get all treatment plans
treatmentPlansRouter.get('/', async (req, res) => {
  try {
    const treatmentPlans = await TreatmentPlan.find().populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    res.json(treatmentPlans)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to get a treatment plan by ID
treatmentPlansRouter.get('/:id', async (req, res) => {
  try {
    const treatmentPlanId = req.params.id
    const treatmentPlan = await TreatmentPlan.findById(treatmentPlanId).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    if (!treatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' })
    }
    res.json(treatmentPlan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
// Route to get treatments by patientId
treatmentPlansRouter.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params

  try {
    const treatments = await TreatmentPlan.find({ paciente: patientId }).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    res.json(treatments)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to create a new treatment plan
treatmentPlansRouter.post('/', async (req, res) => {
  try {
    const { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, paciente } = req.body

    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    const treatmentPlan = new TreatmentPlan({
      cita,
      actividadPlanTrat,
      fechaPlanTrat,
      montoAbono,
      paciente
    })

    const savedTreatmentPlan = await treatmentPlan.save()

    // Add the treatment plan reference to the patient
    existingPatient.treatmentPlans = existingPatient.treatmentPlans.concat(savedTreatmentPlan._id)
    await existingPatient.save()

    res.status(201).json(savedTreatmentPlan)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to update a treatment plan by ID
treatmentPlansRouter.put('/:id', async (req, res) => {
  try {
    const treatmentPlanId = req.params.id
    const { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, paciente } = req.body

    // Validate that the patient exists if updating the patient field
    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(400).json({ error: 'Patient not found' })
      }
    }

    const updatedTreatmentPlan = await TreatmentPlan.findByIdAndUpdate(
      treatmentPlanId,
      { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, paciente },
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

// Route to delete a treatment plan by ID
treatmentPlansRouter.delete('/:id', async (req, res) => {
  try {
    const treatmentPlanId = req.params.id

    const treatmentPlan = await TreatmentPlan.findById(treatmentPlanId)
    if (!treatmentPlan) {
      return res.status(404).json({ error: 'Treatment plan not found' })
    }

    const patient = await Patient.findById(treatmentPlan.paciente)
    if (patient) {
      patient.treatmentPlans = patient.treatmentPlans.filter(planId => planId.toString() !== treatmentPlanId)
      await patient.save()
    }

    await TreatmentPlan.findByIdAndDelete(treatmentPlanId)

    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = treatmentPlansRouter

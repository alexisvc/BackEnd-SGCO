const express = require('express')
const rehabilitacionOralRouter = express.Router()
const RehabilitacionOral = require('../models/RehabilitacionOral')
const Patient = require('../models/Patient')

// Ruta para obtener todas las rehabilitaciones orales
rehabilitacionOralRouter.get('/', async (req, res) => {
  try {
    const rehabilitacionesOrales = await RehabilitacionOral.find().populate('paciente', 'nombrePaciente numeroCedula')
    res.json(rehabilitacionesOrales)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una rehabilitación oral por su ID
rehabilitacionOralRouter.get('/:id', async (req, res) => {
  try {
    const rehabilitacionOralId = req.params.id
    const rehabilitacionOral = await RehabilitacionOral.findById(rehabilitacionOralId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!rehabilitacionOral) {
      return res.status(404).json({ error: 'RehabilitacionOral not found' })
    }

    res.json(rehabilitacionOral)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una rehabilitación oral por el ID del paciente
rehabilitacionOralRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const rehabilitacionOral = await RehabilitacionOral.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!rehabilitacionOral) {
      return res.status(404).json({ error: 'RehabilitacionOral not found for this patient' })
    }

    res.json(rehabilitacionOral)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para crear una nueva rehabilitación oral
rehabilitacionOralRouter.post('/', async (req, res) => {
  try {
    const { paciente, ...rehabilitacionOralData } = req.body

    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    // Check if the patient already has a rehabilitacion oral record
    const existingRehabilitacionOral = await RehabilitacionOral.findOne({ paciente })
    if (existingRehabilitacionOral) {
      return res.status(400).json({ error: 'Patient already has a RehabilitacionOral record' })
    }

    const rehabilitacionOral = new RehabilitacionOral({
      ...rehabilitacionOralData,
      paciente
    })

    const savedRehabilitacionOral = await rehabilitacionOral.save()

    // Add the rehabilitacion oral reference to the patient
    existingPatient.rehabilitacionOral = savedRehabilitacionOral._id
    await existingPatient.save()

    res.status(201).json(savedRehabilitacionOral)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una rehabilitación oral por su ID
rehabilitacionOralRouter.put('/:id', async (req, res) => {
  try {
    const rehabilitacionOralId = req.params.id
    const { paciente, ...rehabilitacionOralData } = req.body

    // Validate that the patient exists if updating the patient field
    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(400).json({ error: 'Patient not found' })
      }
    }

    const updatedRehabilitacionOral = await RehabilitacionOral.findByIdAndUpdate(
      rehabilitacionOralId,
      { paciente, ...rehabilitacionOralData },
      { new: true, runValidators: true }
    )

    if (!updatedRehabilitacionOral) {
      return res.status(404).json({ error: 'RehabilitacionOral not found' })
    }

    // If patient is being updated, ensure unique reference
    if (paciente) {
      await Patient.findByIdAndUpdate(updatedRehabilitacionOral.paciente, {
        $pull: { rehabilitacionOral: rehabilitacionOralId }
      })
      const existingPatient = await Patient.findById(paciente)
      existingPatient.rehabilitacionOral = updatedRehabilitacionOral._id
      await existingPatient.save()
    }

    res.json(updatedRehabilitacionOral)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar una rehabilitación oral por su ID
rehabilitacionOralRouter.delete('/:id', async (req, res) => {
  try {
    const rehabilitacionOralId = req.params.id

    const rehabilitacionOral = await RehabilitacionOral.findById(rehabilitacionOralId)
    if (!rehabilitacionOral) {
      return res.status(404).json({ error: 'RehabilitacionOral not found' })
    }

    // Remove reference from patient's rehabilitacionOral field
    await Patient.findByIdAndUpdate(rehabilitacionOral.paciente, {
      $pull: { rehabilitacionOral: rehabilitacionOralId }
    })

    await RehabilitacionOral.findByIdAndDelete(rehabilitacionOralId)

    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = rehabilitacionOralRouter

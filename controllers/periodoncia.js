const express = require('express')
const periodonciaRouter = express.Router()
const Periodoncia = require('../models/Periodoncia')
const Patient = require('../models/Patient')

// Obtener todas las periodoncias
periodonciaRouter.get('/', async (req, res) => {
  try {
    const periodoncias = await Periodoncia.find().populate('paciente', 'nombrePaciente numeroCedula')
    res.json(periodoncias)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener una periodoncia por su ID
periodonciaRouter.get('/:id', async (req, res) => {
  try {
    const periodonciaId = req.params.id
    const periodoncia = await Periodoncia.findById(periodonciaId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!periodoncia) {
      return res.status(404).json({ error: 'Periodoncia not found' })
    }

    res.json(periodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener todas las periodoncias de un paciente por su ID
periodonciaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const periodoncias = await Periodoncia.find({ paciente: patientId }).populate('paciente')

    if (!periodoncias || periodoncias.length === 0) {
      return res.status(404).json({ error: 'Periodoncias not found for this patient' })
    }

    res.json(periodoncias)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Registrar una nueva periodoncia
periodonciaRouter.post('/', async (req, res) => {
  try {
    const { paciente, ...periodonciaData } = req.body

    // Verificar si ya existe una periodoncia para el paciente
    const existingPeriodoncia = await Periodoncia.findOne({ paciente })
    if (existingPeriodoncia) {
      return res.status(400).json({ error: 'Patient already has a Periodoncia record' })
    }

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const periodoncia = new Periodoncia({
      paciente,
      ...periodonciaData
    })

    const savedPeriodoncia = await periodoncia.save()
    existingPatient.periodoncia = savedPeriodoncia._id
    await existingPatient.save()

    res.status(201).json(savedPeriodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Actualizar una periodoncia por su ID
periodonciaRouter.put('/:id', async (req, res) => {
  try {
    const periodonciaId = req.params.id
    const { paciente, ...periodonciaData } = req.body

    const existingPeriodoncia = await Periodoncia.findById(periodonciaId)
    if (!existingPeriodoncia) {
      return res.status(404).json({ error: 'Periodoncia not found' })
    }

    Object.assign(existingPeriodoncia, periodonciaData)

    const updatedPeriodoncia = await existingPeriodoncia.save()
    res.json(updatedPeriodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Eliminar una periodoncia por su ID
periodonciaRouter.delete('/:id', async (req, res) => {
  try {
    const periodonciaId = req.params.id
    const deletedPeriodoncia = await Periodoncia.findByIdAndDelete(periodonciaId)

    if (!deletedPeriodoncia) {
      return res.status(404).json({ error: 'Periodoncia not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = periodonciaRouter

const express = require('express')
const ortodonciaRouter = express.Router()
const Ortodoncia = require('../models/Ortodoncia')
const Patient = require('../models/Patient')

// Obtener todas las ortodoncias
ortodonciaRouter.get('/', async (req, res) => {
  try {
    const ortodoncias = await Ortodoncia.find().populate('paciente', 'nombrePaciente numeroCedula')
    res.json(ortodoncias)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener una ortodoncia por su ID
ortodonciaRouter.get('/:id', async (req, res) => {
  try {
    const ortodonciaId = req.params.id
    const ortodoncia = await Ortodoncia.findById(ortodonciaId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!ortodoncia) {
      return res.status(404).json({ error: 'Ortodoncia not found' })
    }

    res.json(ortodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener todas las ortodoncias de un paciente por su ID
ortodonciaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const ortodoncias = await Ortodoncia.find({ paciente: patientId }).populate('paciente')

    if (!ortodoncias || ortodoncias.length === 0) {
      return res.status(404).json({ error: 'Ortodoncias not found for this patient' })
    }

    res.json(ortodoncias)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Registrar una nueva ortodoncia
ortodonciaRouter.post('/', async (req, res) => {
  try {
    const { paciente, ...ortodonciaData } = req.body

    // Validar si se proporcionó el ID del paciente
    if (!paciente) {
      return res.status(400).json({ error: 'Patient ID is required' })
    }

    // Verificar si ya existe una ortodoncia para el paciente
    const existingOrtodoncia = await Ortodoncia.findOne({ paciente })
    if (existingOrtodoncia) {
      return res.status(400).json({ error: 'Patient already has an Ortodoncia record' })
    }

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const ortodoncia = new Ortodoncia({
      paciente,
      ...ortodonciaData
    })

    const savedOrtodoncia = await ortodoncia.save()
    existingPatient.ortodoncia = savedOrtodoncia._id
    await existingPatient.save()

    res.status(201).json(savedOrtodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Actualizar una ortodoncia por su ID
ortodonciaRouter.put('/:id', async (req, res) => {
  try {
    const ortodonciaId = req.params.id
    const { paciente, ...ortodonciaData } = req.body

    const existingOrtodoncia = await Ortodoncia.findById(ortodonciaId)
    if (!existingOrtodoncia) {
      return res.status(404).json({ error: 'Ortodoncia not found' })
    }

    Object.assign(existingOrtodoncia, ortodonciaData)

    const updatedOrtodoncia = await existingOrtodoncia.save()
    res.json(updatedOrtodoncia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Eliminar una ortodoncia por su ID
ortodonciaRouter.delete('/:id', async (req, res) => {
  try {
    const ortodonciaId = req.params.id
    const deletedOrtodoncia = await Ortodoncia.findByIdAndDelete(ortodonciaId)

    if (!deletedOrtodoncia) {
      return res.status(404).json({ error: 'Ortodoncia not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = ortodonciaRouter

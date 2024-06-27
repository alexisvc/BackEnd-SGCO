const express = require('express')
const cirugiaPatologiaRouter = express.Router()
const CirugiaPatologia = require('../models/CirugiaPatologia')
const Patient = require('../models/Patient')

// Ruta para obtener todas las cirugías patológicas
cirugiaPatologiaRouter.get('/', async (req, res) => {
  try {
    const cirugiaPatologias = await CirugiaPatologia.find().populate('paciente', 'nombrePaciente numeroCedula')
    res.json(cirugiaPatologias)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una cirugía patológica por su ID
cirugiaPatologiaRouter.get('/:id', async (req, res) => {
  try {
    const cirugiaPatologiaId = req.params.id
    const cirugiaPatologia = await CirugiaPatologia.findById(cirugiaPatologiaId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!cirugiaPatologia) {
      return res.status(404).json({ error: 'CirugiaPatologia not found' })
    }

    res.json(cirugiaPatologia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una cirugía patológica por el ID del paciente
cirugiaPatologiaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const cirugiaPatologia = await CirugiaPatologia.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!cirugiaPatologia) {
      return res.status(404).json({ error: 'CirugiaPatologia not found for this patient' })
    }

    res.json(cirugiaPatologia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva cirugía patológica
cirugiaPatologiaRouter.post('/', async (req, res) => {
  try {
    const { paciente, ...cirugiaPatologiaData } = req.body

    if (!paciente) {
      return res.status(400).json({ error: 'Patient ID is required' })
    }

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const existingCirugiaPatologia = await CirugiaPatologia.findOne({ paciente })
    if (existingCirugiaPatologia) {
      return res.status(400).json({ error: 'Patient already has a CirugiaPatologia record' })
    }

    const cirugiaPatologia = new CirugiaPatologia({
      paciente,
      ...cirugiaPatologiaData
    })

    const savedCirugiaPatologia = await cirugiaPatologia.save()
    existingPatient.cirugiaPatologia = savedCirugiaPatologia._id
    await existingPatient.save()
    res.status(201).json(savedCirugiaPatologia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una cirugía patológica por su ID
cirugiaPatologiaRouter.put('/:id', async (req, res) => {
  try {
    const cirugiaPatologiaId = req.params.id
    const { paciente, ...cirugiaPatologiaData } = req.body

    const existingCirugiaPatologia = await CirugiaPatologia.findById(cirugiaPatologiaId)
    if (!existingCirugiaPatologia) {
      return res.status(404).json({ error: 'CirugiaPatologia not found' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' })
      }
      existingCirugiaPatologia.paciente = paciente
    }

    Object.assign(existingCirugiaPatologia, cirugiaPatologiaData)

    const updatedCirugiaPatologia = await existingCirugiaPatologia.save()
    res.json(updatedCirugiaPatologia)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar una cirugía patológica por su ID
cirugiaPatologiaRouter.delete('/:id', async (req, res) => {
  try {
    const cirugiaPatologiaId = req.params.id
    const deletedCirugiaPatologia = await CirugiaPatologia.findByIdAndDelete(cirugiaPatologiaId)

    if (!deletedCirugiaPatologia) {
      return res.status(404).json({ error: 'CirugiaPatologia not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = cirugiaPatologiaRouter

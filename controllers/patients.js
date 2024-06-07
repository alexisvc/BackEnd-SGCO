const express = require('express')
const patientsRouter = express.Router()
const Patient = require('../models/Patient')

// Ruta para obtener todos los pacientes
patientsRouter.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().populate('medicalRecords')
    res.json(patients)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener un paciente por su ID
patientsRouter.get('/:id', async (req, res) => {
  try {
    const patientId = req.params.id
    const patient = await Patient.findById(patientId)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    res.json(patient)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar un nuevo paciente
patientsRouter.post('/', async (req, res) => {
  try {
    const { name, age, gender } = req.body

    if (!name || !age || !gender) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const patient = new Patient({
      name,
      age,
      gender
    })

    const savedPatient = await patient.save()
    res.json(savedPatient)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar un paciente por su ID
patientsRouter.put('/:id', async (req, res) => {
  try {
    const patientId = req.params.id
    const { name, age, gender } = req.body

    const existingPatient = await Patient.findById(patientId)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    if (name) existingPatient.name = name
    if (age) existingPatient.age = age
    if (gender) existingPatient.gender = gender

    const updatedPatient = await existingPatient.save()
    res.json(updatedPatient)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar un paciente por su ID
patientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const deletedPatient = await Patient.findByIdAndDelete(id)

    if (!deletedPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

module.exports = patientsRouter

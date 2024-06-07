const express = require('express')
const medicalRecordsRouter = express.Router()
const MedicalRecord = require('../models/MedicalRecord')
const Patient = require('../models/Patient')

// Ruta para obtener todas las historias clínicas
medicalRecordsRouter.get('/', async (req, res) => {
  try {
    const medicalRecords = await MedicalRecord.find().populate('patient')
    res.json(medicalRecords)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una historia clínica por su ID
medicalRecordsRouter.get('/:id', async (req, res) => {
  try {
    const medicalRecordId = req.params.id
    const medicalRecord = await MedicalRecord.findById(medicalRecordId).populate('patient')

    if (!medicalRecord) {
      return res.status(404).json({ error: 'Medical record not found' })
    }

    res.json(medicalRecord)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener todas las historias clínicas de un paciente por su ID
medicalRecordsRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const medicalRecords = await MedicalRecord.find({ patient: patientId }).populate('patient')

    res.json(medicalRecords)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva historia clínica
medicalRecordsRouter.post('/', async (req, res) => {
  try {
    const { date, description, patientId } = req.body

    if (!date || !description || !patientId) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const patient = await Patient.findById(patientId)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const medicalRecord = new MedicalRecord({
      date,
      description,
      patient: patientId
    })

    const savedMedicalRecord = await medicalRecord.save()
    res.json(savedMedicalRecord)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una historia clínica por su ID
medicalRecordsRouter.put('/:id', async (req, res) => {
  try {
    const medicalRecordId = req.params.id
    const { date, description } = req.body

    const existingMedicalRecord = await MedicalRecord.findById(medicalRecordId)
    if (!existingMedicalRecord) {
      return res.status(404).json({ error: 'Medical record not found' })
    }

    if (date) existingMedicalRecord.date = date
    if (description) existingMedicalRecord.description = description

    const updatedMedicalRecord = await existingMedicalRecord.save()
    res.json(updatedMedicalRecord)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar una historia clínica por su ID
medicalRecordsRouter.delete('/:id', async (req, res) => {
  try {
    const medicalRecordId = req.params.id
    const deletedMedicalRecord = await MedicalRecord.findByIdAndDelete(medicalRecordId)

    if (!deletedMedicalRecord) {
      return res.status(404).json({ error: 'Medical record not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = medicalRecordsRouter

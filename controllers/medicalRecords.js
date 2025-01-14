const express = require('express')
const { body, validationResult } = require('express-validator')
const medicalRecordsRouter = express.Router()
const MedicalRecord = require('../models/MedicalRecord')
const Patient = require('../models/Patient')

const authMiddleware = require('../middleware/authMiddleware')

// Aplica el middleware de autenticación a todas las rutas
medicalRecordsRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de historias clínicas
const validateMedicalRecordData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('date').isISO8601().toDate().withMessage('La fecha debe ser una fecha válida en formato ISO8601'),
  body('description').isString().trim().escape().notEmpty().withMessage('La descripción es obligatoria y debe ser un texto válido')
]

// Ruta para obtener todas las historias clínicas
medicalRecordsRouter.get('/', async (req, res) => {
  try {
    const medicalRecords = await MedicalRecord.find().populate('paciente')
    res.json(medicalRecords)
  } catch (error) {
    console.error('Error al obtener historias clínicas:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para obtener una historia clínica por su ID
medicalRecordsRouter.get('/:id', async (req, res) => {
  try {
    const medicalRecordId = req.params.id
    const medicalRecord = await MedicalRecord.findById(medicalRecordId).populate('paciente')

    if (!medicalRecord) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' })
    }

    res.json(medicalRecord)
  } catch (error) {
    console.error('Error al obtener historia clínica:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para obtener todas las historias clínicas de un paciente por su ID
medicalRecordsRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const medicalRecord = await MedicalRecord.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!medicalRecord) {
      return res.status(404).json({ error: 'Historia clínica no encontrada para este paciente' })
    }

    res.json(medicalRecord)
  } catch (error) {
    console.error('Error al obtener historia clínica del paciente:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para registrar una nueva historia clínica
medicalRecordsRouter.post('/', validateMedicalRecordData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { date, description, paciente, ...medicalRecordData } = req.body

    const patient = await Patient.findById(paciente)
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const existingMedicalRecord = await MedicalRecord.findOne({ paciente })
    if (existingMedicalRecord) {
      return res.status(400).json({ error: 'El paciente ya tiene una historia clínica registrada' })
    }

    const medicalRecord = new MedicalRecord({
      date,
      description,
      paciente,
      ...medicalRecordData
    })

    const savedMedicalRecord = await medicalRecord.save()
    patient.historiaClinica = savedMedicalRecord._id
    await patient.save()

    res.status(201).json(savedMedicalRecord)
  } catch (error) {
    console.error('Error al registrar historia clínica:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para actualizar una historia clínica por su ID
medicalRecordsRouter.put('/:id', validateMedicalRecordData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const medicalRecordId = req.params.id
    const { date, description, ...medicalRecordData } = req.body

    const existingMedicalRecord = await MedicalRecord.findById(medicalRecordId)
    if (!existingMedicalRecord) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' })
    }

    if (date) existingMedicalRecord.date = date
    if (description) existingMedicalRecord.description = description
    Object.assign(existingMedicalRecord, medicalRecordData)

    const updatedMedicalRecord = await existingMedicalRecord.save()
    res.json(updatedMedicalRecord)
  } catch (error) {
    console.error('Error al actualizar historia clínica:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para eliminar una historia clínica por su ID
medicalRecordsRouter.delete('/:id', async (req, res) => {
  try {
    const medicalRecordId = req.params.id
    const deletedMedicalRecord = await MedicalRecord.findByIdAndDelete(medicalRecordId)

    if (!deletedMedicalRecord) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' })
    }

    const patient = await Patient.findById(deletedMedicalRecord.paciente)
    if (patient) {
      patient.historiaClinica = null
      await patient.save()
    }

    res.status(204).end()
  } catch (error) {
    console.error('Error al eliminar historia clínica:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = medicalRecordsRouter

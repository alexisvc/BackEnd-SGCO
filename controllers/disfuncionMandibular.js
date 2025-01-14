const express = require('express')
const { body, validationResult } = require('express-validator')
const disfuncionMandibularRouter = express.Router()
const DisfuncionMandibular = require('../models/DisfuncionMandibular')
const Patient = require('../models/Patient')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
disfuncionMandibularRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de disfunción mandibular
const validateDisfuncionMandibularData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('sintomas').optional().isString().trim().escape().withMessage('Los síntomas deben ser un texto válido'),
  body('diagnostico').optional().isString().trim().escape().withMessage('El diagnóstico debe ser un texto válido'),
  body('tratamiento').optional().isString().trim().escape().withMessage('El tratamiento debe ser un texto válido')
]

// Ruta para obtener todas las disfunciones mandibulares
disfuncionMandibularRouter.get('/', async (req, res) => {
  try {
    const disfuncionesMandibulares = await DisfuncionMandibular.find().populate('paciente', 'nombrePaciente numeroCedula')
    res.json(disfuncionesMandibulares)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una disfunción mandibular por su ID
disfuncionMandibularRouter.get('/:id', async (req, res) => {
  try {
    const disfuncionMandibularId = req.params.id
    const disfuncionMandibular = await DisfuncionMandibular.findById(disfuncionMandibularId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!disfuncionMandibular) {
      return res.status(404).json({ error: 'DisfuncionMandibular not found' })
    }

    res.json(disfuncionMandibular)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una disfunción mandibular por el ID del paciente
disfuncionMandibularRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const disfuncionMandibular = await DisfuncionMandibular.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!disfuncionMandibular) {
      return res.status(404).json({ error: 'DisfuncionMandibular not found for this patient' })
    }

    res.json(disfuncionMandibular)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para crear una nueva disfunción mandibular
disfuncionMandibularRouter.post('/', validateDisfuncionMandibularData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, ...disfuncionMandibularData } = req.body

    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    // Check if the patient already has a disfuncion mandibular record
    const existingDisfuncionMandibular = await DisfuncionMandibular.findOne({ paciente })
    if (existingDisfuncionMandibular) {
      return res.status(400).json({ error: 'Patient already has a DisfuncionMandibular record' })
    }

    const disfuncionMandibular = new DisfuncionMandibular({
      ...disfuncionMandibularData,
      paciente
    })

    const savedDisfuncionMandibular = await disfuncionMandibular.save()

    // Add the disfuncion mandibular reference to the patient
    existingPatient.disfuncionMandibular = savedDisfuncionMandibular._id
    await existingPatient.save()

    res.status(201).json(savedDisfuncionMandibular)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una disfunción mandibular por su ID
disfuncionMandibularRouter.put('/:id', validateDisfuncionMandibularData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const disfuncionMandibularId = req.params.id
    const { paciente, ...disfuncionMandibularData } = req.body

    // Validate that the patient exists if updating the patient field
    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(400).json({ error: 'Patient not found' })
      }
    }

    const updatedDisfuncionMandibular = await DisfuncionMandibular.findByIdAndUpdate(
      disfuncionMandibularId,
      { paciente, ...disfuncionMandibularData },
      { new: true, runValidators: true }
    )

    if (!updatedDisfuncionMandibular) {
      return res.status(404).json({ error: 'DisfuncionMandibular not found' })
    }

    // If patient is being updated, ensure unique reference
    if (paciente) {
      // Eliminar la referencia anterior asignando null
      await Patient.findByIdAndUpdate(updatedDisfuncionMandibular.paciente, {
        disfuncionMandibular: null
      })
      // Actualizar el paciente con la nueva referencia
      const existingPatient = await Patient.findById(paciente)
      existingPatient.disfuncionMandibular = updatedDisfuncionMandibular._id
      await existingPatient.save()
    }

    res.json(updatedDisfuncionMandibular)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar una disfunción mandibular por su ID
disfuncionMandibularRouter.delete('/:id', async (req, res) => {
  try {
    const disfuncionMandibularId = req.params.id

    const disfuncionMandibular = await DisfuncionMandibular.findById(disfuncionMandibularId)
    if (!disfuncionMandibular) {
      return res.status(404).json({ error: 'DisfuncionMandibular not found' })
    }

    // Remove reference from patient's disfuncionMandibular field
    await Patient.findByIdAndUpdate(disfuncionMandibular.paciente, {
      $pull: { disfuncionMandibular: disfuncionMandibularId }
    })

    await DisfuncionMandibular.findByIdAndDelete(disfuncionMandibularId)

    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = disfuncionMandibularRouter

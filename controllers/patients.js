const express = require('express')
const { body, validationResult } = require('express-validator')
const patientsRouter = express.Router()
const Patient = require('../models/Patient')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
patientsRouter.use(authMiddleware)

// Ruta para obtener todos los pacientes
patientsRouter.get('/', async (req, res) => {
  try {
    const patients = await Patient.find()
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

// Ruta para obtener un paciente por número de cédula
patientsRouter.get('/cedula/:numeroCedula', async (req, res) => {
  try {
    const numeroCedula = req.params.numeroCedula
    const patient = await Patient.findOne({ numeroCedula })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    res.json(patient)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Nueva ruta para buscar pacientes por nombre
patientsRouter.get('/nombre/:nombrePaciente', async (req, res) => {
  try {
    const nombrePaciente = req.params.nombrePaciente
    const patients = await Patient.find({ nombrePaciente: { $regex: nombrePaciente, $options: 'i' } })
    if (patients.length === 0) {
      return res.status(404).json({ error: 'No patients found' })
    }
    res.json(patients)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar un nuevo paciente con validaciones
patientsRouter.post(
  '/',
  [
    body('nombrePaciente').trim().escape().notEmpty().withMessage('El nombre es obligatorio'),
    body('edadPaciente').isInt({ min: 0 }).withMessage('La edad debe ser un número entero positivo'),
    body('fechaNacimiento').isISO8601().toDate().withMessage('La fecha de nacimiento debe ser válida'),
    body('correoPaciente').isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('direccionPaciente').trim().escape().notEmpty().withMessage('La dirección es obligatoria'),
    body('generoPaciente').trim().escape().notEmpty().withMessage('El género es obligatorio'),
    body('numeroCedula').isNumeric().isLength({ min: 10, max: 10 }).withMessage('Número de cédula inválido'),
    body('ocupacion').trim().escape().notEmpty().withMessage('La ocupación es obligatoria'),
    body('telefono').matches(/^5939\d{8}$/).withMessage('El teléfono debe tener el formato 5939xxxxxxxx'),
    body('telContactoEmergencia').matches(/^5939\d{8}$/).withMessage('El teléfono de emergencia debe tener el formato 5939xxxxxxxx'),
    body('afinidadContactoEmergencia').trim().escape().notEmpty().withMessage('La afinidad es obligatoria')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      nombrePaciente,
      edadPaciente,
      fechaNacimiento,
      correoPaciente,
      direccionPaciente,
      generoPaciente,
      numeroCedula,
      ocupacion,
      telefono,
      telContactoEmergencia,
      afinidadContactoEmergencia
    } = req.body

    try {
      const patient = new Patient({
        nombrePaciente,
        edadPaciente,
        fechaNacimiento,
        correoPaciente,
        direccionPaciente,
        generoPaciente,
        numeroCedula,
        ocupacion,
        telefono,
        telContactoEmergencia,
        afinidadContactoEmergencia
      })

      const savedPatient = await patient.save()
      res.json(savedPatient)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// Ruta para actualizar un paciente por su ID con validaciones
patientsRouter.put(
  '/:id',
  [
    body('nombrePaciente').optional().trim().escape().notEmpty().withMessage('El nombre es obligatorio'),
    body('edadPaciente').optional().isInt({ min: 0 }).withMessage('La edad debe ser un número entero positivo'),
    body('fechaNacimiento').optional().isISO8601().toDate().withMessage('La fecha de nacimiento debe ser válida'),
    body('correoPaciente').optional().isEmail().withMessage('Correo inválido').normalizeEmail(),
    body('direccionPaciente').optional().trim().escape().notEmpty().withMessage('La dirección es obligatoria'),
    body('generoPaciente').optional().trim().escape().notEmpty().withMessage('El género es obligatorio'),
    body('numeroCedula').optional().isNumeric().isLength({ min: 10, max: 10 }).withMessage('Número de cédula inválido'),
    body('ocupacion').optional().trim().escape().notEmpty().withMessage('La ocupación es obligatoria'),
    body('telefono').optional().matches(/^5939\d{8}$/).withMessage('El teléfono debe tener el formato 5939xxxxxxxx'),
    body('telContactoEmergencia').optional().matches(/^5939\d{8}$/).withMessage('El teléfono de emergencia debe tener el formato 5939xxxxxxxx'),
    body('afinidadContactoEmergencia').optional().trim().escape().notEmpty().withMessage('La afinidad es obligatoria')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const patientId = req.params.id

    try {
      const existingPatient = await Patient.findById(patientId)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' })
      }

      // Actualización de los campos
      const updatedData = req.body
      Object.assign(existingPatient, updatedData)

      const updatedPatient = await existingPatient.save()
      res.json(updatedPatient)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

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

const express = require('express')
const { body, params, validationResult } = require('express-validator')
const rehabilitacionOralRouter = express.Router()
const RehabilitacionOral = require('../models/RehabilitacionOral')
const Patient = require('../models/Patient')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
rehabilitacionOralRouter.use(authMiddleware)

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/') // Carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // Nombre único para el archivo
  }
})

const upload = multer({ storage })

// Middleware para validar y sanitizar los datos de rehabilitación oral
const validateRehabilitacionOralData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB')
  // body('diagnostico').isString().trim().escape().notEmpty().withMessage('El diagnóstico es obligatorio y debe ser un texto válido'),
  // body('comentarios').optional().isString().trim().escape().withMessage('Los comentarios deben ser un texto válido')
]

// Ruta para obtener todas las rehabilitaciones orales
rehabilitacionOralRouter.get('/', async (req, res) => {
  try {
    const rehabilitacionesOrales = await RehabilitacionOral.find().populate('paciente', 'nombrePaciente numeroCedula')
    // Añadir la URL completa del archivo si existe
    const rehabilitacionesOralesWithFileUrl = rehabilitacionesOrales.map(rehabilitacionesOral => ({
      ...rehabilitacionesOral._doc,
      archivo1Url: rehabilitacionesOral.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionesOral.archivo1}` : null,
      archivo2Url: rehabilitacionesOral.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionesOral.archivo2}` : null,
      archivo3Url: rehabilitacionesOral.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionesOral.archivo3}` : null
    }))
    res.json(rehabilitacionesOralesWithFileUrl)
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

    // Añadir la URL completa del archivo si existe
    const rehabilitacionesOralWithFileUrl = {
      ...rehabilitacionOral._doc,
      archivo1Url: rehabilitacionOral.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo1}` : null,
      archivo2Url: rehabilitacionOral.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo2}` : null,
      archivo3Url: rehabilitacionOral.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo3}` : null
    }

    res.json(rehabilitacionesOralWithFileUrl)
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

    // Añadir la URL completa del archivo si existe
    const rehabilitacionOralWithFileUrl = {
      ...rehabilitacionOral._doc,
      archivo1Url: rehabilitacionOral.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo1}` : null,
      archivo2Url: rehabilitacionOral.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo2}` : null,
      archivo3Url: rehabilitacionOral.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${rehabilitacionOral.archivo3}` : null
    }

    res.json(rehabilitacionOralWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para crear una nueva rehabilitación oral
rehabilitacionOralRouter.post('/', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 },
  { name: 'archivo3', maxCount: 1 }
]), validateRehabilitacionOralData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, ...rehabilitacionOralData } = req.body
    // const { paciente, diagnostico, comentarios } = req.body;
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null
    const archivo3 = req.files && req.files.archivo3 ? req.files.archivo3[0].filename : null

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const existingRehabilitacionOral = await RehabilitacionOral.findOne({ paciente })
    if (existingRehabilitacionOral) {
      return res.status(400).json({ error: 'El paciente ya tiene un registro de rehabilitación oral' })
    }

    const rehabilitacionOral = new RehabilitacionOral({
      paciente,
      ...rehabilitacionOralData,
      archivo1,
      archivo2,
      archivo3
    })

    const savedRehabilitacionOral = await rehabilitacionOral.save()
    existingPatient.rehabilitacionOral = savedRehabilitacionOral._id
    await existingPatient.save()

    const savedRehabilitacionOralWithFileUrl = {
      ...savedRehabilitacionOral._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${savedRehabilitacionOral.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${savedRehabilitacionOral.archivo2}` : null,
      archivo3Url: archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${savedRehabilitacionOral.archivo3}` : null
    }

    res.status(201).json(savedRehabilitacionOralWithFileUrl)
  } catch (error) {
    console.error('Error al registrar rehabilitación oral:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para actualizar una rehabilitación oral por su ID
rehabilitacionOralRouter.put('/:id', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 },
  { name: 'archivo3', maxCount: 1 }
]), validateRehabilitacionOralData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const rehabilitacionOralId = req.params.id
    const { paciente, ...rehabilitacionOralData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null
    const archivo3 = req.files && req.files.archivo3 ? req.files.archivo3[0].filename : null

    const existingRehabilitacionOral = await RehabilitacionOral.findById(rehabilitacionOralId)

    if (!existingRehabilitacionOral) {
      return res.status(404).json({ error: 'Rehabilitacion Oral not found' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Paciente no encontrado' })
      }
      existingRehabilitacionOral.paciente = paciente
    }

    if (archivo1) existingRehabilitacionOral.archivo1 = archivo1
    if (archivo2) existingRehabilitacionOral.archivo2 = archivo2
    if (archivo3) existingRehabilitacionOral.archivo3 = archivo3

    Object.assign(existingRehabilitacionOral, rehabilitacionOralData)

    const updatedRehabilitacionOral = await existingRehabilitacionOral.save()

    const updatedRehabilitacionOralWithFileUrl = {
      ...updatedRehabilitacionOral._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedRehabilitacionOral.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedRehabilitacionOral.archivo2}` : null,
      archivo3Url: archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${updatedRehabilitacionOral.archivo3}` : null
    }

    res.json(updatedRehabilitacionOralWithFileUrl)
  } catch (error) {
    console.error('Error al actualizar rehabilitación oral:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para eliminar una rehabilitación oral por su ID
rehabilitacionOralRouter.delete('/:id', async (req, res) => {
  try {
    const rehabilitacionOralId = req.params.id
    const deletedRehabilitacionOral = await RehabilitacionOral.findByIdAndDelete(rehabilitacionOralId)

    if (!deletedRehabilitacionOral) {
      return res.status(404).json({ error: 'CirugiaPatologia not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = rehabilitacionOralRouter

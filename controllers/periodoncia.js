const express = require('express')
const { body, param, validationResult } = require('express-validator')
const periodonciaRouter = express.Router()
const Periodoncia = require('../models/Periodoncia')
const Patient = require('../models/Patient')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
periodonciaRouter.use(authMiddleware)

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

// Middleware para validar y sanitizar los datos de periodoncia
const validatePeriodonciaData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB')
  // body('diagnostico').isString().trim().escape().notEmpty().withMessage('El diagnóstico es obligatorio y debe ser un texto válido'),
  // body('comentarios').optional().isString().trim().escape().withMessage('Los comentarios deben ser un texto válido')
]

// Obtener todas las periodoncias
periodonciaRouter.get('/', async (req, res) => {
  try {
    const periodoncias = await Periodoncia.find().populate('paciente', 'nombrePaciente numeroCedula')
    // Añadir la URL completa del archivo si existe
    const periodonciasWithFileUrl = periodoncias.map(periodoncia => ({
      ...periodoncia._doc,
      archivo1Url: periodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo1}` : null,
      archivo2Url: periodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo2}` : null
    }))
    res.json(periodonciasWithFileUrl)
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

    // Añadir la URL completa del archivo si existe
    const periodonciaWithFileUrl = {
      ...periodoncia._doc,
      archivo1Url: periodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo1}` : null,
      archivo2Url: periodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo2}` : null
    }

    res.json(periodonciaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener todas las periodoncias de un paciente por su ID
periodonciaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const periodoncia = await Periodoncia.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!periodoncia || periodoncia.length === 0) {
      return res.status(404).json({ error: 'Periodoncias not found for this patient' })
    }

    // Añadir la URL completa del archivo si existe
    const periodonciaWithFileUrl = {
      ...periodoncia._doc,
      archivo1Url: periodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo1}` : null,
      archivo2Url: periodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${periodoncia.archivo2}` : null
    }

    res.json(periodonciaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva periodoncia
periodonciaRouter.post('/', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 }
]), validatePeriodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, ...periodonciaData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const existingPeriodoncia = await Periodoncia.findOne({ paciente })
    if (existingPeriodoncia) {
      return res.status(400).json({ error: 'El paciente ya tiene un registro de periodoncia' })
    }

    const periodoncia = new Periodoncia({
      paciente,
      ...periodonciaData,
      archivo1,
      archivo2
    })

    const savedPeriodoncia = await periodoncia.save()
    existingPatient.periodoncia = savedPeriodoncia._id
    await existingPatient.save()

    const savedPeriodonciaWithFileUrl = {
      ...savedPeriodoncia._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${savedPeriodoncia.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${savedPeriodoncia.archivo2}` : null
    }

    res.status(201).json(savedPeriodonciaWithFileUrl)
  } catch (error) {
    console.error('Error al registrar periodoncia:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para actualizar una periodoncia por su ID
periodonciaRouter.put('/:id', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 }
]), validatePeriodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const periodonciaId = req.params.id
    // const { paciente, diagnostico, comentarios } = req.body;
    const { paciente, ...periodonciaData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingPeriodoncia = await Periodoncia.findById(periodonciaId)
    if (!existingPeriodoncia) {
      return res.status(404).json({ error: 'Periodoncia no encontrada' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Paciente no encontrado' })
      }
      existingPeriodoncia.paciente = paciente
    }

    if (archivo1) existingPeriodoncia.archivo1 = archivo1
    if (archivo2) existingPeriodoncia.archivo2 = archivo2
    Object.assign(existingPeriodoncia, periodonciaData)

    const updatedPeriodoncia = await existingPeriodoncia.save()

    const updatedPeriodonciaWithFileUrl = {
      ...updatedPeriodoncia._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedPeriodoncia.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedPeriodoncia.archivo2}` : null
    }

    res.json(updatedPeriodonciaWithFileUrl)
  } catch (error) {
    console.error('Error al actualizar periodoncia:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
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

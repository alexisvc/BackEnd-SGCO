const express = require('express')
const { body, validationResult } = require('express-validator')
const ortodonciaRouter = express.Router()
const Ortodoncia = require('../models/Ortodoncia')
const Patient = require('../models/Patient')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
ortodonciaRouter.use(authMiddleware)

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

// Middleware para validar y sanitizar los datos de ortodoncia
const validateOrtodonciaData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('diagnostico').isString().trim().escape().notEmpty().withMessage('El diagnóstico de ortodoncia es obligatorio y debe ser un texto válido'),
  body('comentarios').optional().isString().trim().escape().withMessage('Los comentarios deben ser un texto válido')
]

// Obtener todas las ortodoncias
ortodonciaRouter.get('/', async (req, res) => {
  try {
    const ortodoncias = await Ortodoncia.find().populate('paciente', 'nombrePaciente numeroCedula')
    // Añadir la URL completa del archivo si existe
    const ortodonciasWithFileUrl = ortodoncias.map(ortodoncia => ({
      ...ortodoncia._doc,
      archivo1Url: ortodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo1}` : null,
      archivo2Url: ortodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo2}` : null,
      archivo3Url: ortodoncia.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo3}` : null
    }))
    res.json(ortodonciasWithFileUrl)
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

    // Añadir la URL completa del archivo si existe
    const ortodonciaWithFileUrl = {
      ...ortodoncia._doc,
      archivo1Url: ortodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo1}` : null,
      archivo2Url: ortodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo2}` : null,
      archivo3Url: ortodoncia.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo3}` : null
    }

    res.json(ortodonciaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener todas las ortodoncias de un paciente por su ID
ortodonciaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const ortodoncia = await Ortodoncia.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!ortodoncia) {
      return res.status(404).json({ error: 'Ortodoncias not found for this patient' })
    }

    // Añadir la URL completa del archivo si existe
    const ortodonciaWithFileUrl = {
      ...ortodoncia._doc,
      archivo1Url: ortodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo1}` : null,
      archivo2Url: ortodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo2}` : null,
      archivo3Url: ortodoncia.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${ortodoncia.archivo3}` : null
    }

    res.json(ortodonciaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva ortodoncia
ortodonciaRouter.post('/', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 },
  { name: 'archivo3', maxCount: 1 }
]), validateOrtodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    // const { paciente, diagnosticoOrtodoncia, comentarios } = req.body;
    const { paciente, ...ortodonciaData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null
    const archivo3 = req.files && req.files.archivo3 ? req.files.archivo3[0].filename : null

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const existingOrtodoncia = await Ortodoncia.findOne({ paciente })
    if (existingOrtodoncia) {
      return res.status(400).json({ error: 'El paciente ya tiene un registro de ortodoncia' })
    }

    const ortodoncia = new Ortodoncia({
      paciente,
      ...ortodonciaData,
      archivo1,
      archivo2,
      archivo3
    })

    const savedOrtodoncia = await ortodoncia.save()
    existingPatient.ortodoncia = savedOrtodoncia._id
    await existingPatient.save()

    const savedOrtodonciaWithFileUrl = {
      ...savedOrtodoncia._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${savedOrtodoncia.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${savedOrtodoncia.archivo2}` : null,
      archivo3Url: archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${savedOrtodoncia.archivo3}` : null
    }

    res.status(201).json(savedOrtodonciaWithFileUrl)
  } catch (error) {
    console.error('Error al registrar ortodoncia:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para actualizar una ortodoncia por su ID
ortodonciaRouter.put('/:id', upload.fields([
  { name: 'archivo1', maxCount: 1 },
  { name: 'archivo2', maxCount: 1 },
  { name: 'archivo3', maxCount: 1 }
]), validateOrtodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const ortodonciaId = req.params.id
    const { paciente, ...ortodonciaData } = req.body
    // const { paciente, diagnosticoOrtodoncia, comentarios } = req.body;
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null
    const archivo3 = req.files && req.files.archivo3 ? req.files.archivo3[0].filename : null

    const existingOrtodoncia = await Ortodoncia.findById(ortodonciaId)
    if (!existingOrtodoncia) {
      return res.status(404).json({ error: 'Ortodoncia no encontrada' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Paciente no encontrado' })
      }
      existingOrtodoncia.paciente = paciente
    }

    // if (diagnosticoOrtodoncia) existingOrtodoncia.diagnosticoOrtodoncia = diagnosticoOrtodoncia;
    // if (comentarios) existingOrtodoncia.comentarios = comentarios;
    if (archivo1) existingOrtodoncia.archivo1 = archivo1
    if (archivo2) existingOrtodoncia.archivo2 = archivo2
    if (archivo3) existingOrtodoncia.archivo3 = archivo3
    Object.assign(existingOrtodoncia, ortodonciaData)

    const updatedOrtodoncia = await existingOrtodoncia.save()

    const updatedOrtodonciaWithFileUrl = {
      ...updatedOrtodoncia._doc,
      archivo1Url: updatedOrtodoncia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedOrtodoncia.archivo1}` : null,
      archivo2Url: updatedOrtodoncia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedOrtodoncia.archivo2}` : null,
      archivo3Url: updatedOrtodoncia.archivo3 ? `${req.protocol}://${req.get('host')}/uploads/${updatedOrtodoncia.archivo3}` : null
    }

    res.json(updatedOrtodonciaWithFileUrl)
  } catch (error) {
    console.error('Error al actualizar ortodoncia:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
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

const express = require('express')
const consentimientoRouter = express.Router()
const Consentimiento = require('../models/Consentimiento')
const Patient = require('../models/Patient')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
consentimientoRouter.use(authMiddleware)

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

// Ruta para obtener todos los consentimientos
consentimientoRouter.get('/', async (req, res) => {
  try {
    const consentimientos = await Consentimiento.find().populate('paciente')
    // Añadir la URL completa del archivo
    const consentimientosWithFileUrl = consentimientos.map(consentimiento => ({
      ...consentimiento._doc,
      archivoUrl: `${req.protocol}://${req.get('host')}/uploads/${consentimiento.archivo}`
    }))
    res.json(consentimientosWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener un consentimiento por su ID
consentimientoRouter.get('/:id', async (req, res) => {
  try {
    const consentimientoId = req.params.id
    const consentimiento = await Consentimiento.findById(consentimientoId).populate('paciente', 'nombrePaciente numeroCedula')

    if (!consentimiento) {
      return res.status(404).json({ error: 'Consentimiento not found' })
    }

    // Añadir la URL completa del archivo
    const consentimientoWithFileUrl = {
      ...consentimiento._doc,
      archivoUrl: `${req.protocol}://${req.get('host')}/uploads/${consentimiento.archivo}`
    }

    res.json(consentimientoWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener consentimientos por el ID del paciente
consentimientoRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const consentimiento = await Consentimiento.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!consentimiento) {
      return res.status(404).json({ error: 'Consentimientos not found for this patient' })
    }

    // Añadir la URL completa del archivo
    const consentimientoWithFileUrl = {
      ...consentimiento._doc,
      archivoUrl: `${req.protocol}://${req.get('host')}/uploads/${consentimiento.archivo}`
    }

    res.json(consentimientoWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar un nuevo consentimiento
consentimientoRouter.post('/', upload.single('archivo'), async (req, res) => {
  try {
    const { paciente } = req.body
    const archivo = req.file ? req.file.filename : null

    if (!paciente || !archivo) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const patient = await Patient.findById(paciente)
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const existingConsentimiento = await Consentimiento.findOne({ paciente })
    if (existingConsentimiento) {
      return res.status(400).json({ error: 'Patient already has a consentimiento' })
    }

    const consentimiento = new Consentimiento({
      archivo,
      paciente
    })

    const savedConsentimiento = await consentimiento.save()

    // Añadir la URL completa del archivo
    const savedConsentimientoWithFileUrl = {
      ...savedConsentimiento._doc,
      archivoUrl: `${req.protocol}://${req.get('host')}/uploads/${savedConsentimiento.archivo}`
    }

    res.json(savedConsentimientoWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar un consentimiento por su ID
consentimientoRouter.put('/:id', upload.single('archivo'), async (req, res) => {
  try {
    const consentimientoId = req.params.id
    const archivo = req.file ? req.file.filename : null
    const { paciente } = req.body

    const existingConsentimiento = await Consentimiento.findById(consentimientoId)
    if (!existingConsentimiento) {
      return res.status(404).json({ error: 'Consentimiento not found' })
    }

    if (archivo) existingConsentimiento.archivo = archivo
    if (paciente) existingConsentimiento.paciente = paciente

    const updatedConsentimiento = await existingConsentimiento.save()

    // Añadir la URL completa del archivo
    const updatedConsentimientoWithFileUrl = {
      ...updatedConsentimiento._doc,
      archivoUrl: `${req.protocol}://${req.get('host')}/uploads/${updatedConsentimiento.archivo}`
    }

    res.json(updatedConsentimientoWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar un consentimiento por su ID
consentimientoRouter.delete('/:id', async (req, res) => {
  try {
    const consentimientoId = req.params.id
    const deletedConsentimiento = await Consentimiento.findByIdAndDelete(consentimientoId)

    if (!deletedConsentimiento) {
      return res.status(404).json({ error: 'Consentimiento not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = consentimientoRouter

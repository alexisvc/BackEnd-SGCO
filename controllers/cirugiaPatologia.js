const express = require('express')
const { body, validationResult } = require('express-validator')
const cirugiaPatologiaRouter = express.Router()
const CirugiaPatologia = require('../models/CirugiaPatologia')
const Patient = require('../models/Patient')
const multer = require('multer')
const path = require('path')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
cirugiaPatologiaRouter.use(authMiddleware)

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

// Middleware para validar y sanitizar los datos de la cirugía patológica
const validateCirugiaPatologiaData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('antecedentesCirPat').optional().isString().trim().escape().withMessage('Los antecedentes deben ser un texto válido'),
  body('alergiasMedCirPat').optional().isString().trim().escape().withMessage('Las alergias deben ser un texto válido'),
  body('patologiaTejBland').optional().isString().trim().escape().withMessage('La patología de tejidos blandos debe ser un texto válido'),
  body('patologiaTejDuros').optional().isString().trim().escape().withMessage('La patología de tejidos duros debe ser un texto válido'),
  body('diagRadiografico').optional().isString().trim().escape().withMessage('El diagnóstico radiográfico debe ser un texto válido'),
  body('localizacionPatologia').optional().isString().trim().escape().withMessage('La localización de la patología debe ser un texto válido'),
  body('extraccionDental').optional().isString().trim().escape().withMessage('La extracción dental debe ser un texto válido')
]

// Ruta para obtener todas las cirugías patológicas
cirugiaPatologiaRouter.get('/', async (req, res) => {
  try {
    const cirugiaPatologias = await CirugiaPatologia.find().populate('paciente', 'nombrePaciente numeroCedula')
    // Añadir la URL completa del archivo si existe
    const cirugiaPatologiasWithFileUrl = cirugiaPatologias.map(cirugiaPatologia => ({
      ...cirugiaPatologia._doc,
      archivo1Url: cirugiaPatologia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo1}` : null,
      archivo2Url: cirugiaPatologia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo2}` : null
    }))
    res.json(cirugiaPatologiasWithFileUrl)
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

    // Añadir la URL completa del archivo si existe
    const cirugiaPatologiaWithFileUrl = {
      ...cirugiaPatologia._doc,
      archivo1Url: cirugiaPatologia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo1}` : null,
      archivo2Url: cirugiaPatologia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo2}` : null
    }

    res.json(cirugiaPatologiaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una cirugía patológica por el ID del paciente
cirugiaPatologiaRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const cirugiaPatologias = await CirugiaPatologia.find({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    // Añadir la URL completa del archivo si existe
    const cirugiaPatologiaWithFileUrl = cirugiaPatologias.map(cirugiaPatologia => ({
      ...cirugiaPatologia._doc,
      archivo1Url: cirugiaPatologia.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo1}` : null,
      archivo2Url: cirugiaPatologia.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo2}` : null
    }))

    res.json(cirugiaPatologiaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva cirugía patológica
cirugiaPatologiaRouter.post('/', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), validateCirugiaPatologiaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, ...cirugiaPatologiaData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const cirugiaPatologia = new CirugiaPatologia({
      paciente,
      ...cirugiaPatologiaData,
      archivo1,
      archivo2
    })

    const savedCirugiaPatologia = await cirugiaPatologia.save()

    // Añadir la referencia de la cirugía patológica al paciente
    if (!Array.isArray(existingPatient.cirugiaPatologia)) {
      existingPatient.cirugiaPatologia = []
    }
    existingPatient.cirugiaPatologia.push(savedCirugiaPatologia._id)
    await existingPatient.save()

    const savedCirugiaPatologiaWithFileUrl = {
      ...savedCirugiaPatologia._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${savedCirugiaPatologia.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${savedCirugiaPatologia.archivo2}` : null
    }

    res.status(201).json(savedCirugiaPatologiaWithFileUrl)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una cirugía patológica por su ID
cirugiaPatologiaRouter.put('/:id', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), validateCirugiaPatologiaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const cirugiaPatologiaId = req.params.id
    const { paciente, ...cirugiaPatologiaData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

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

    if (archivo1) existingCirugiaPatologia.archivo1 = archivo1
    if (archivo2) existingCirugiaPatologia.archivo2 = archivo2
    Object.assign(existingCirugiaPatologia, cirugiaPatologiaData)

    const updatedCirugiaPatologia = await existingCirugiaPatologia.save()

    const updatedCirugiaPatologiaWithFileUrl = {
      ...updatedCirugiaPatologia._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedCirugiaPatologia.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedCirugiaPatologia.archivo2}` : null
    }

    res.json(updatedCirugiaPatologiaWithFileUrl)
  } catch (error) {
    console.error('Error:', error)
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

const express = require('express')
const { body, validationResult } = require('express-validator')
const endodonticTreatmentRouter = express.Router()
const EndodonticTreatment = require('../models/EndodonticTreatment')
const Patient = require('../models/Patient')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
endodonticTreatmentRouter.use(authMiddleware)

const multer = require('multer')
const path = require('path')

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

// Middleware para validar y sanitizar los datos del tratamiento de endodoncia
const validateEndodonticTreatmentData = [
  body('paciente').isMongoId().withMessage('El ID del paciente debe ser un ID válido de MongoDB'),
  body('descripcion').optional().isString().trim().escape().withMessage('La descripción debe ser un texto válido'),
  body('diagnostico').optional().isString().trim().escape().withMessage('El diagnóstico debe ser un texto válido'),
  body('tratamiento').optional().isString().trim().escape().withMessage('El tratamiento debe ser un texto válido')
]

// Route to get all endodontic treatments
endodonticTreatmentRouter.get('/', async (req, res) => {
  try {
    const endodonticTreatments = await EndodonticTreatment.find().populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    // Añadir la URL completa del archivo si existe
    const endodonticTreatmentsWithFileUrl = endodonticTreatments.map(endodonticTreatment => ({
      ...endodonticTreatment._doc,
      archivo1Url: endodonticTreatment.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo1}` : null,
      archivo2Url: endodonticTreatment.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo2}` : null
    }))
    res.json(endodonticTreatmentsWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to get an endodontic treatment by ID
endodonticTreatmentRouter.get('/:id', async (req, res) => {
  try {
    const endodonticTreatmentId = req.params.id
    const endodonticTreatment = await EndodonticTreatment.findById(endodonticTreatmentId).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })

    if (!endodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' })
    }

    // Añadir la URL completa del archivo si existe
    const endodonticTreatmentsWithFileUrl = {
      ...endodonticTreatment._doc,
      archivo1Url: endodonticTreatment.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo1}` : null,
      archivo2Url: endodonticTreatment.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo2}` : null
    }

    res.json(endodonticTreatmentsWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to get all endodontic treatments by patient ID
endodonticTreatmentRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const endodonticTreatments = await EndodonticTreatment.find({ paciente: patientId }).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })

    // Añadir la URL completa del archivo si existe
    const endodonticTreatmentsWithFileUrl = endodonticTreatments.map(endodonticTreatment => ({
      ...endodonticTreatment._doc,
      archivo1Url: endodonticTreatment.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo1}` : null,
      archivo2Url: endodonticTreatment.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${endodonticTreatment.archivo2}` : null
    }))

    res.json(endodonticTreatmentsWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para crear un nuevo tratamiento de endodoncia
endodonticTreatmentRouter.post('/', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), validateEndodonticTreatmentData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { paciente, ...endodonticTreatmentData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const endodonticTreatment = new EndodonticTreatment({
      paciente,
      ...endodonticTreatmentData,
      archivo1,
      archivo2
    })

    const savedEndodonticTreatment = await endodonticTreatment.save()

    existingPatient.endodoncia.push(savedEndodonticTreatment._id)
    await existingPatient.save()

    const savedEndodonticTreatmentWithFileUrl = {
      ...savedEndodonticTreatment._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${savedEndodonticTreatment.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${savedEndodonticTreatment.archivo2}` : null
    }

    res.status(201).json(savedEndodonticTreatmentWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar un tratamiento de endodoncia por su ID
endodonticTreatmentRouter.put('/:id', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), validateEndodonticTreatmentData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const endodonticTreatmentId = req.params.id
    const { paciente, ...endodonticTreatmentData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingEndodonticTreatment = await EndodonticTreatment.findById(endodonticTreatmentId)
    if (!existingEndodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' })
      }
      existingEndodonticTreatment.paciente = paciente
    }

    if (archivo1) existingEndodonticTreatment.archivo1 = archivo1
    if (archivo2) existingEndodonticTreatment.archivo2 = archivo2
    Object.assign(existingEndodonticTreatment, endodonticTreatmentData)

    const updatedEndodonticTreatment = await existingEndodonticTreatment.save()

    const updatedEndodonticTreatmentWithFileUrl = {
      ...updatedEndodonticTreatment._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedEndodonticTreatment.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedEndodonticTreatment.archivo2}` : null
    }

    res.json(updatedEndodonticTreatmentWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar un tratamiento de endodoncia por su ID
endodonticTreatmentRouter.delete('/:id', async (req, res) => {
  try {
    const endodonticTreatmentId = req.params.id
    const deletedEndodonticTreatment = await EndodonticTreatment.findByIdAndDelete(endodonticTreatmentId)

    if (!deletedEndodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' })
    }

    // Remove reference from patient's endodoncia array
    await Patient.findByIdAndUpdate(deletedEndodonticTreatment.paciente, {
      $pull: { endodoncia: endodonticTreatmentId }
    })

    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
module.exports = endodonticTreatmentRouter

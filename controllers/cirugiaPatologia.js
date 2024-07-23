const express = require('express')
const cirugiaPatologiaRouter = express.Router()
const CirugiaPatologia = require('../models/CirugiaPatologia')
const Patient = require('../models/Patient')
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

// Ruta para obtener todas las cirugías patológicas
cirugiaPatologiaRouter.get('/', async (req, res) => {
  try {
    const cirugiaPatologias = await CirugiaPatologia.find().populate('paciente', 'nombrePaciente numeroCedula')
    // Añadir la URL completa del archivo si existe
    const cirugiaPatologiasWithFileUrl = cirugiaPatologias.map(cirugiaPatologia => ({
      ...cirugiaPatologia._doc,
      archivoUrl: cirugiaPatologia.archivo ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo}` : null
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
      archivoUrl: cirugiaPatologia.archivo ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo}` : null
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
    const cirugiaPatologia = await CirugiaPatologia.findOne({ paciente: patientId }).populate('paciente', 'nombrePaciente numeroCedula')

    if (!cirugiaPatologia) {
      return res.status(404).json({ error: 'CirugiaPatologia not found for this patient' })
    }

    // Añadir la URL completa del archivo si existe
    const cirugiaPatologiaWithFileUrl = {
      ...cirugiaPatologia._doc,
      archivoUrl: cirugiaPatologia.archivo ? `${req.protocol}://${req.get('host')}/uploads/${cirugiaPatologia.archivo}` : null
    }

    res.json(cirugiaPatologiaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva cirugía patológica
cirugiaPatologiaRouter.post('/', upload.single('archivo'), async (req, res) => {
  try {
    const { paciente, ...cirugiaPatologiaData } = req.body
    const archivo = req.file ? req.file.filename : null

    if (!paciente) {
      return res.status(400).json({ error: 'Patient ID is required' })
    }

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const existingCirugiaPatologia = await CirugiaPatologia.findOne({ paciente })
    if (existingCirugiaPatologia) {
      return res.status(400).json({ error: 'Patient already has a CirugiaPatologia record' })
    }

    const cirugiaPatologia = new CirugiaPatologia({
      paciente,
      ...cirugiaPatologiaData,
      archivo
    })

    const savedCirugiaPatologia = await cirugiaPatologia.save()
    existingPatient.cirugiaPatologia = savedCirugiaPatologia._id
    await existingPatient.save()
    
    // Añadir la URL completa del archivo si existe
    const savedCirugiaPatologiaWithFileUrl = {
      ...savedCirugiaPatologia._doc,
      archivoUrl: archivo ? `${req.protocol}://${req.get('host')}/uploads/${savedCirugiaPatologia.archivo}` : null
    }

    res.status(201).json(savedCirugiaPatologiaWithFileUrl)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una cirugía patológica por su ID
cirugiaPatologiaRouter.put('/:id', upload.single('archivo'), async (req, res) => {
  try {
    const cirugiaPatologiaId = req.params.id
    const { paciente, ...cirugiaPatologiaData } = req.body
    const archivo = req.file ? req.file.filename : null

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

    if (archivo) existingCirugiaPatologia.archivo = archivo
    Object.assign(existingCirugiaPatologia, cirugiaPatologiaData)

    const updatedCirugiaPatologia = await existingCirugiaPatologia.save()
    
    // Añadir la URL completa del archivo si existe
    const updatedCirugiaPatologiaWithFileUrl = {
      ...updatedCirugiaPatologia._doc,
      archivoUrl: archivo ? `${req.protocol}://${req.get('host')}/uploads/${updatedCirugiaPatologia.archivo}` : null
    }

    res.json(updatedCirugiaPatologiaWithFileUrl)
  } catch (error) {
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

const express = require('express')
const evolutionChartsRouter = express.Router()
const EvolutionChart = require('../models/EvolutionChart')
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

// Route to get all evolution charts
evolutionChartsRouter.get('/', async (req, res) => {
  try {
    const evolutionCharts = await EvolutionChart.find().populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    // Añadir la URL completa del archivo si existe
    const evolutionChartsWithFileUrl = evolutionCharts.map(evolutionChart => ({
      ...evolutionChart._doc,
      archivo1Url: evolutionChart.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo1}` : null,
      archivo2Url: evolutionChart.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo2}` : null
    }))
    res.json(evolutionChartsWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to get an evolution chart by ID
evolutionChartsRouter.get('/:id', async (req, res) => {
  try {
    const evolutionChartId = req.params.id
    const evolutionChart = await EvolutionChart.findById(evolutionChartId).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    if (!evolutionChart) {
      return res.status(404).json({ error: 'Evolution chart not found' })
    }
    
    // Añadir la URL completa del archivo si existe
    const evolutionChartWithFileUrl = {
      ...evolutionChart._doc,
      archivo1Url: evolutionChart.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo1}` : null,
      archivo2Url: evolutionChart.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo2}` : null
    }

    res.json(evolutionChartWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to get evolution charts by patient ID
evolutionChartsRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId
    const evolutionCharts = await EvolutionChart.find({ paciente: patientId }).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    
    // Añadir la URL completa del archivo si existe
    const evolutionChartsWithFileUrl = evolutionCharts.map(evolutionChart => ({
      ...evolutionChart._doc,
      archivo1Url: evolutionChart.archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo1}` : null,
      archivo2Url: evolutionChart.archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo2}` : null
    }))

    res.json(evolutionChartsWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to create a new evolution chart
evolutionChartsRouter.post('/', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), async (req, res) => {
  try {
    const { paciente, ...evolutionChartData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null
    
    if (!paciente) {
      return res.status(400).json({ error: 'Patient ID is required' })
    }
    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    const evolutionChart = new EvolutionChart({
      paciente,
      ...evolutionChartData,
      archivo1,
      archivo2
    })

    const savedEvolutionChart = await evolutionChart.save()

    // Add the evolution chart reference to the patient
    existingPatient.evolutionCharts = existingPatient.evolutionCharts.concat(savedEvolutionChart._id)
    await existingPatient.save()

    // Añadir la URL completa del archivo si existe
    const evolutionChartWithFileUrl = {
      ...evolutionChart._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${evolutionChart.archivo2}` : null
    }

    res.status(201).json(evolutionChartWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to update an evolution chart by ID
evolutionChartsRouter.put('/:id', upload.fields([{ name: 'archivo1', maxCount: 1 }, { name: 'archivo2', maxCount: 1 }]), async (req, res) => {
  try {
    const evolutionChartId = req.params.id
    const { paciente, ...evolutionChartData } = req.body
    const archivo1 = req.files && req.files.archivo1 ? req.files.archivo1[0].filename : null
    const archivo2 = req.files && req.files.archivo2 ? req.files.archivo2[0].filename : null

    const existingEvolutionChart = await EvolutionChart.findById(evolutionChartId)
    if (!existingEvolutionChart) {
      return res.status(404).json({ error: 'evolutionChart not found' })
    }

    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' })
      }
      existingEvolutionChart.paciente = paciente
    }

    if (archivo1) existingEvolutionChart.archivo1 = archivo1
    if (archivo2) existingEvolutionChart.archivo2 = archivo2
    Object.assign(existingEvolutionChart, evolutionChartData)

    const updatedEvolutionChart = await existingEvolutionChart.save()

    // Añadir la URL completa del archivo si existe
    const updatedEvolutionChartWithFileUrl = {
      ...updatedEvolutionChart._doc,
      archivo1Url: archivo1 ? `${req.protocol}://${req.get('host')}/uploads/${updatedEvolutionChart.archivo1}` : null,
      archivo2Url: archivo2 ? `${req.protocol}://${req.get('host')}/uploads/${updatedEvolutionChart.archivo2}` : null
    }

    res.json(updatedEvolutionChartWithFileUrl)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to delete an evolution chart by ID
evolutionChartsRouter.delete('/:id', async (req, res) => {
  try {
    const evolutionChartId = req.params.id
    const deletedEvolutionChart = await EvolutionChart.findByIdAndDelete(evolutionChartId)

    if (!deletedEvolutionChart) {
      return res.status(404).json({ error: 'EvolutionChart not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = evolutionChartsRouter

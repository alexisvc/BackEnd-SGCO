const express = require('express')
const evolutionChartsRouter = express.Router()
const EvolutionChart = require('../models/EvolutionChart')
const Patient = require('../models/Patient')

// Route to get all evolution charts
evolutionChartsRouter.get('/', async (req, res) => {
  try {
    const evolutionCharts = await EvolutionChart.find().populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    res.json(evolutionCharts)
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
    res.json(evolutionChart)
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
    res.json(evolutionCharts)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to create a new evolution chart
evolutionChartsRouter.post('/', async (req, res) => {
  try {
    const { fechaCuadEvol, actividadCuadEvol, recomendacionCuadEvol, firmaOdon, firmaPaciente, paciente } = req.body

    // Validate that all required fields are provided
    if (!fechaCuadEvol || !actividadCuadEvol || !recomendacionCuadEvol || !firmaOdon || !firmaPaciente || !paciente) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' })
    }

    const evolutionChart = new EvolutionChart({
      fechaCuadEvol,
      actividadCuadEvol,
      recomendacionCuadEvol,
      firmaOdon,
      firmaPaciente,
      paciente
    })

    const savedEvolutionChart = await evolutionChart.save()

    // Add the evolution chart reference to the patient
    existingPatient.evolutionCharts = existingPatient.evolutionCharts.concat(savedEvolutionChart._id)
    await existingPatient.save()

    res.status(201).json(savedEvolutionChart)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to update an evolution chart by ID
evolutionChartsRouter.put('/:id', async (req, res) => {
  try {
    const evolutionChartId = req.params.id
    const { fechaCuadEvol, actividadCuadEvol, recomendacionCuadEvol, firmaOdon, firmaPaciente, paciente } = req.body

    // Validate that the patient exists if updating the patient field
    if (paciente) {
      const existingPatient = await Patient.findById(paciente)
      if (!existingPatient) {
        return res.status(400).json({ error: 'Patient not found' })
      }
    }

    const updatedEvolutionChart = await EvolutionChart.findByIdAndUpdate(
      evolutionChartId,
      { fechaCuadEvol, actividadCuadEvol, recomendacionCuadEvol, firmaOdon, firmaPaciente, paciente },
      { new: true, runValidators: true }
    )

    if (!updatedEvolutionChart) {
      return res.status(404).json({ error: 'Evolution chart not found' })
    }

    res.json(updatedEvolutionChart)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Route to delete an evolution chart by ID
evolutionChartsRouter.delete('/:id', async (req, res) => {
  try {
    const evolutionChartId = req.params.id

    const evolutionChart = await EvolutionChart.findById(evolutionChartId)
    if (!evolutionChart) {
      return res.status(404).json({ error: 'Evolution chart not found' })
    }

    const patient = await Patient.findById(evolutionChart.paciente)
    if (patient) {
      patient.evolutionCharts = patient.evolutionCharts.filter(chartId => chartId.toString() !== evolutionChartId)
      await patient.save()
    }

    await EvolutionChart.findByIdAndDelete(evolutionChartId)

    res.status(204).end()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = evolutionChartsRouter

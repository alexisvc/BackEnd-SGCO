const express = require('express')
const { body, validationResult } = require('express-validator')
const evolucionOrtodonciaRouter = express.Router()
const EvolucionOrtodoncia = require('../models/EvolucionOrtodoncia')
const Ortodoncia = require('../models/Ortodoncia')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
evolucionOrtodonciaRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de la evolución de ortodoncia
const validateEvolucionOrtodonciaData = [
  body('ortodoncia').isMongoId().withMessage('El ID de ortodoncia debe ser un ID válido de MongoDB'),
  body('observaciones').optional().isString().trim().escape().withMessage('Las observaciones deben ser un texto válido'),
  body('fecha').optional().isISO8601().toDate().withMessage('La fecha debe ser una fecha válida en formato ISO8601')
]

// Obtener todas las evoluciones de ortodoncia
evolucionOrtodonciaRouter.get('/', async (req, res) => {
  try {
    const evoluciones = await EvolucionOrtodoncia.find().populate('ortodoncia', 'diagnosticoOrtodoncia')
    res.json(evoluciones)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener una evolución de ortodoncia por su ID
evolucionOrtodonciaRouter.get('/:id', async (req, res) => {
  try {
    const evolucionId = req.params.id
    const evolucion = await EvolucionOrtodoncia.findById(evolucionId).populate('ortodoncia', 'diagnosticoOrtodoncia')

    if (!evolucion) {
      return res.status(404).json({ error: 'EvolucionOrtodoncia not found' })
    }

    res.json(evolucion)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Obtener todas las evoluciones de una ortodoncia por su ID
evolucionOrtodonciaRouter.get('/ortodoncia/:ortodonciaId', async (req, res) => {
  try {
    const ortodonciaId = req.params.ortodonciaId
    const evoluciones = await EvolucionOrtodoncia.find({ ortodoncia: ortodonciaId }).populate('ortodoncia')

    if (!evoluciones || evoluciones.length === 0) {
      return res.status(404).json({ error: 'Evoluciones not found for this ortodoncia' })
    }

    res.json(evoluciones)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar una nueva evolución de ortodoncia
evolucionOrtodonciaRouter.post('/', validateEvolucionOrtodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { ortodoncia, ...evolucionData } = req.body

    const existingOrtodoncia = await Ortodoncia.findById(ortodoncia)
    if (!existingOrtodoncia) {
      return res.status(404).json({ error: 'Ortodoncia not found' })
    }

    const evolucionOrtodoncia = new EvolucionOrtodoncia({
      ortodoncia,
      ...evolucionData
    })

    const savedEvolucion = await evolucionOrtodoncia.save()
    existingOrtodoncia.evoluciones = existingOrtodoncia.evoluciones.concat(savedEvolucion._id)
    await existingOrtodoncia.save()

    res.status(201).json(savedEvolucion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una evolución de ortodoncia por su ID
evolucionOrtodonciaRouter.put('/:id', validateEvolucionOrtodonciaData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const evolucionId = req.params.id
    const { ortodoncia, ...evolucionData } = req.body

    const existingEvolucion = await EvolucionOrtodoncia.findById(evolucionId)
    if (!existingEvolucion) {
      return res.status(404).json({ error: 'EvolucionOrtodoncia not found' })
    }

    Object.assign(existingEvolucion, evolucionData)

    const updatedEvolucion = await existingEvolucion.save()
    res.json(updatedEvolucion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Eliminar una evolución de ortodoncia por su ID
evolucionOrtodonciaRouter.delete('/:id', async (req, res) => {
  try {
    const evolucionId = req.params.id
    const deletedEvolucion = await EvolucionOrtodoncia.findByIdAndDelete(evolucionId)

    if (!deletedEvolucion) {
      return res.status(404).json({ error: 'EvolucionOrtodoncia not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = evolucionOrtodonciaRouter

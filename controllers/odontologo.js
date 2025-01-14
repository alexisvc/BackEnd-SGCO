const express = require('express')
const { body, validationResult } = require('express-validator')
const odontologoRouter = express.Router()
const Odontologo = require('../models/Odontologo')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
odontologoRouter.use(authMiddleware)

// Middleware para validar y sanitizar los datos de odontólogos
const validateOdontologoData = [
  body('nombreOdontologo').isString().trim().escape().notEmpty().withMessage('El nombre es obligatorio y debe ser un texto válido'),
  body('edadOdontologo').isInt({ min: 18 }).withMessage('La edad debe ser un número entero mayor o igual a 18'),
  body('correoOdontologo').isEmail().normalizeEmail().withMessage('El correo debe ser un correo electrónico válido'),
  body('direccionOdontologo').isString().trim().escape().notEmpty().withMessage('La dirección es obligatoria y debe ser un texto válido'),
  body('generoOdontologo').isIn(['masculino', 'femenino']).withMessage('El género debe ser masculino o femenino'),
  body('especialidad').isString().trim().escape().notEmpty().withMessage('La especialidad es obligatoria y debe ser un texto válido'),
  body('telefono').matches(/^\d{10}$/).withMessage('El teléfono debe ser un número de 10 dígitos')
]

// Ruta para obtener todos los odontólogos
odontologoRouter.get('/', async (req, res) => {
  try {
    const odontologos = await Odontologo.find()
    res.json(odontologos)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener un odontólogo por su ID
odontologoRouter.get('/:id', async (req, res) => {
  try {
    const odontologoId = req.params.id
    const odontologo = await Odontologo.findById(odontologoId)
    if (!odontologo) {
      return res.status(404).json({ error: 'Odontólogo not found' })
    }
    res.json(odontologo)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para buscar odontólogos por nombre (usando regex para búsqueda flexible)
odontologoRouter.get('/nombre/:nombreOdontologo', async (req, res) => {
  try {
    const nombreOdontologo = req.params.nombreOdontologo
    const odontologos = await Odontologo.find({
      nombreOdontologo: { $regex: nombreOdontologo, $options: 'i' } // Búsqueda insensible a mayúsculas
    })
    if (odontologos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron odontólogos con ese nombre' })
    }
    res.json(odontologos)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para buscar odontólogos por especialidad
odontologoRouter.get('/especialidad/:especialidad', async (req, res) => {
  try {
    const especialidad = req.params.especialidad
    const odontologos = await Odontologo.find({ especialidad: { $regex: especialidad, $options: 'i' } })
    if (odontologos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron odontólogos con esa especialidad' })
    }
    res.json(odontologos)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar un nuevo odontólogo
odontologoRouter.post('/', validateOdontologoData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const {
      nombreOdontologo,
      edadOdontologo,
      correoOdontologo,
      direccionOdontologo,
      generoOdontologo,
      especialidad,
      telefono
    } = req.body

    const odontologo = new Odontologo({
      nombreOdontologo,
      edadOdontologo,
      correoOdontologo,
      direccionOdontologo,
      generoOdontologo,
      especialidad,
      telefono
    })

    const savedOdontologo = await odontologo.save()
    res.status(201).json(savedOdontologo)
  } catch (error) {
    console.error('Error al registrar odontólogo:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para actualizar un odontólogo por su ID
odontologoRouter.put('/:id', validateOdontologoData, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const odontologoId = req.params.id
    const {
      nombreOdontologo,
      edadOdontologo,
      correoOdontologo,
      direccionOdontologo,
      generoOdontologo,
      especialidad,
      telefono
    } = req.body

    const existingOdontologo = await Odontologo.findById(odontologoId)
    if (!existingOdontologo) {
      return res.status(404).json({ error: 'Odontólogo no encontrado' })
    }

    existingOdontologo.nombreOdontologo = nombreOdontologo
    existingOdontologo.edadOdontologo = edadOdontologo
    existingOdontologo.correoOdontologo = correoOdontologo
    existingOdontologo.direccionOdontologo = direccionOdontologo
    existingOdontologo.generoOdontologo = generoOdontologo
    existingOdontologo.especialidad = especialidad
    existingOdontologo.telefono = telefono

    const updatedOdontologo = await existingOdontologo.save()
    res.json(updatedOdontologo)
  } catch (error) {
    console.error('Error al actualizar odontólogo:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta para eliminar un odontólogo por su ID
odontologoRouter.delete('/:id', async (req, res) => {
  try {
    const odontologoId = req.params.id
    const deletedOdontologo = await Odontologo.findByIdAndDelete(odontologoId)

    if (!deletedOdontologo) {
      return res.status(404).json({ error: 'Odontólogo not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = odontologoRouter

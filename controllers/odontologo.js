const express = require('express')
const odontologoRouter = express.Router()
const Odontologo = require('../models/Odontologo')

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
odontologoRouter.post('/', async (req, res) => {
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

    // Validar que todos los campos requeridos están presentes
    if (!nombreOdontologo || !edadOdontologo || !correoOdontologo || !direccionOdontologo || !generoOdontologo || !especialidad || !telefono) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Crear el nuevo odontólogo
    const odontologo = new Odontologo({
      nombreOdontologo,
      edadOdontologo,
      correoOdontologo,
      direccionOdontologo,
      generoOdontologo,
      especialidad,
      telefono
    })

    // Guardar el odontólogo en la base de datos
    const savedOdontologo = await odontologo.save()
    res.json(savedOdontologo)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar un odontólogo por su ID
odontologoRouter.put('/:id', async (req, res) => {
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
      return res.status(404).json({ error: 'Odontólogo not found' })
    }

    if (nombreOdontologo) existingOdontologo.nombreOdontologo = nombreOdontologo
    if (edadOdontologo) existingOdontologo.edadOdontologo = edadOdontologo
    if (correoOdontologo) existingOdontologo.correoOdontologo = correoOdontologo
    if (direccionOdontologo) existingOdontologo.direccionOdontologo = direccionOdontologo
    if (generoOdontologo) existingOdontologo.generoOdontologo = generoOdontologo
    if (especialidad) existingOdontologo.especialidad = especialidad
    if (telefono) existingOdontologo.telefono = telefono

    const updatedOdontologo = await existingOdontologo.save()
    res.json(updatedOdontologo)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
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

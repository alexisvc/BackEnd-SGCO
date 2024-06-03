// Importar los módulos necesarios
const express = require('express')
const bcrypt = require('bcrypt')
const usersRouter = express.Router()
const User = require('../models/User')
const Pictogram = require('../models/Pictogram')
const defaultPictograms = require('../assets/defaultPictograms')

// Ruta para obtener todos los usuarios
usersRouter.get('/', async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para registrar un nuevo usuario
usersRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body

    if (!body.username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    const existingUser = await User.findOne({ username: body.username })
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      passwordHash
    })

    const savedUser = await user.save()

    const userPictograms = defaultPictograms.map((pictogramData) => ({
      ...pictogramData,
      user: savedUser._id
    }))

    const savedPictograms = await Pictogram.insertMany(userPictograms)

    savedUser.pictograms = savedPictograms.map((pictogram) => pictogram._id)
    await savedUser.save()

    res.json(savedUser)
  } catch (error) {
    next(error)
  }
})

// Ruta para actualizar un usuario por su ID
usersRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id
    const { username, name, password } = req.body

    // Verificar si el usuario existe
    const existingUser = await User.findById(userId)

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Actualizar campos necesarios
    if (username) {
      existingUser.username = username
    }

    if (name) {
      existingUser.name = name
    }

    if (password) {
      const saltRounds = 10
      existingUser.passwordHash = await bcrypt.hash(password, saltRounds)
    }

    // Guardar los cambios
    const updatedUser = await existingUser.save()

    res.json(updatedUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar un usuario por su ID
usersRouter.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id

    // Verificar si el usuario existe
    const existingUser = await User.findById(userId)

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Eliminar el usuario
    await existingUser.remove()

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = usersRouter

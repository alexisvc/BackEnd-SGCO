const express = require('express')
const bcrypt = require('bcrypt')
const usersRouter = express.Router()
const User = require('../models/User')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
usersRouter.use(authMiddleware)

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
    const { username, name, password, role } = req.body

    if (!username || !name || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
      username,
      name,
      role,
      passwordHash
    })

    const savedUser = await user.save()
    res.json(savedUser)
  } catch (error) {
    next(error)
  }
})

// Ruta para actualizar un usuario por su ID
usersRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id
    const { username, name, password, role } = req.body

    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (username) existingUser.username = username
    if (name) existingUser.name = name
    if (role) existingUser.role = role
    if (password) {
      const saltRounds = 10
      existingUser.passwordHash = await bcrypt.hash(password, saltRounds)
    }

    const updatedUser = await existingUser.save()
    res.json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar un usuario por su ID
usersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

module.exports = usersRouter

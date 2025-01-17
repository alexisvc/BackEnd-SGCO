const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { body, validationResult } = require('express-validator')
const loginRouter = require('express').Router()
const User = require('../models/User')

// Middleware para validar y sanitizar los datos de inicio de sesión
const validateLoginData = [
  body('username').isString().trim().escape().notEmpty().withMessage('El nombre de usuario es obligatorio y debe ser un texto válido'),
  body('password').isString().trim().notEmpty().withMessage('La contraseña es obligatoria')
]

loginRouter.post('/', validateLoginData, async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })

    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return res.status(401).json({
        error: 'Nombre de usuario o contraseña inválidos'
      })
    }

    const userForToken = {
      username: user.username,
      id: user._id
    }

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: '90min' })

    res.status(200).json({
      name: user.name,
      username: user.username,
      id: user._id,
      token
    })
  } catch (error) {
    console.error('Error en el inicio de sesión:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = loginRouter

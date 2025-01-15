const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization

  // Verifica si el encabezado de autorización está presente
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' })
  }

  // Extrae el token del encabezado
  const token = authHeader.split(' ')[1]

  try {
    // Verifica y decodifica el token
    const decodedToken = jwt.verify(token, process.env.SECRET)

    // Añade la información del usuario al objeto `req` para su uso posterior
    req.user = decodedToken

    // Continua con la siguiente función
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Responde específicamente cuando el token ha expirado
      return res.status(401).json({ error: 'Token expired' })
    }

    // Maneja otros errores de validación del token
    console.error('Invalid token:', error.message)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware

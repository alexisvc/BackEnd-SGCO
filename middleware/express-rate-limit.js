const rateLimit = require('express-rate-limit')

// Configuración del límite de solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 250, // Límite de 250 solicitudes por IP
  message: {
    status: 429,
    error: 'Demasiadas solicitudes. Por favor, inténtalo más tarde.'
  },
  standardHeaders: true, // Enviar información sobre rate limit en los headers `RateLimit-*`
  legacyHeaders: false // Desactivar los headers `X-RateLimit-*` (obsoletos)
})

// Aplicar el middleware globalmente
module.exports = limiter

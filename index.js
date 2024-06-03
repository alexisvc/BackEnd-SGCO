require('dotenv').config()
require('./mongo')

const express = require('express')
const cors = require('cors')
const app = express()

const notFound = require('./middleware/notFound')
const handleErrors = require('./middleware/handleErrors')

const pictogramsRouter = require('./controllers/pictograms')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

app.use(cors())
app.use(express.json())
app.use('/images', express.static('images'))
app.use('/icons', express.static('resources/categories-icons'))

app.use('/adjetivos', express.static('resources/adjetivos'))
app.use('/alimentos', express.static('resources/alimentos'))
app.use('/animales', express.static('resources/animales'))
app.use('/colores', express.static('resources/colores'))
app.use('/cuerpo', express.static('resources/cuerpo'))
app.use('/deportes', express.static('resources/deportes'))
app.use('/espacio', express.static('resources/espacio'))
app.use('/formas', express.static('resources/formas'))
app.use('/higiene', express.static('resources/higiene'))
app.use('/juegos', express.static('resources/juegos'))
app.use('/lugares', express.static('resources/lugares'))
app.use('/personas', express.static('resources/personas'))
app.use('/plantas', express.static('resources/plantas'))
app.use('/pronombres', express.static('resources/pronombres'))
app.use('/ropa', express.static('resources/ropa'))
app.use('/sensaciones-sentimientos', express.static('resources/sensaciones y sentimientos'))
app.use('/tiempo', express.static('resources/tiempo'))
app.use('/transportes', express.static('resources/transportes'))
app.use('/verbos', express.static('resources/verbos'))

app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a mi SGCO</h1>')
})

// Rutas para pictogramas
app.use('/api/pictograms', pictogramsRouter)
// Rutas para usuarios
app.use('/api/users', usersRouter)
// Rutas para login
app.use('/api/login', loginRouter)
// Middleware para manejar errores
app.use(notFound)
app.use(handleErrors)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

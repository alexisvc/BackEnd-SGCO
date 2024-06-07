require('dotenv').config()
require('./mongo')

const express = require('express')
const cors = require('cors')
const app = express()

const notFound = require('./middleware/notFound')
const handleErrors = require('./middleware/handleErrors')

const usersRouter = require('./controllers/users')
const patientsRouter = require('./controllers/patients')
const medicalRecordsRouter = require('./controllers/medicalRecords')
const loginRouter = require('./controllers/login')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a mi SGCO</h1>')
})

// Rutas para usuarios
app.use('/api/users', usersRouter)
// Rutas para pacientes
app.use('/api/patients', patientsRouter)
// Rutas para historias clínicas
app.use('/api/medical-records', medicalRecordsRouter)
// Rutas para login
app.use('/api/login', loginRouter)

// Middleware para manejar errores 404
app.use(notFound)
// Middleware para manejar errores generales
app.use(handleErrors)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

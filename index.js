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
const treatmentPlansRouter = require('./controllers/treatmentPlan')
const evolutionChartsRouter = require('./controllers/evolutionChart')
const endodonticTreatmentRouter = require('./controllers/endodonticTreatment')
const cirugiaPatologiaRouter = require('./controllers/cirugiaPatologia')
const periodonciaRouter = require('./controllers/periodoncia')
const ortodonciaRouter = require('./controllers/ortodoncia')
const evolucionOrtodonciaRouter = require('./controllers/evolucionOrtodoncia')
const rehabilitacionOralRouter = require('./controllers/rehabilitacionOral')
const disfuncionMandibularRouter = require('./controllers/disfuncionMandibular')
const consentimientoRouter = require('./controllers/consentimiento')
const odontologoRouter = require('./controllers/odontologo')
const appointmentsRouter = require('./controllers/appointments')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a mi SGCO</h1>')
})

// uploads
app.use('/uploads', express.static('uploads'))
// Rutas para usuarios
app.use('/api/users', usersRouter)
// Rutas para pacientes
app.use('/api/patients', patientsRouter)
// Rutas para historias clínicas
app.use('/api/medical-records', medicalRecordsRouter)
// Rutas para login
app.use('/api/login', loginRouter)
// Rutas para planes de tratamiento
app.use('/api/treatment-plans', treatmentPlansRouter)
// Rutas para cuadros de evolución
app.use('/api/evolution-charts', evolutionChartsRouter)
// Rutas para tratamientos de endodoncia
app.use('/api/endodontic-treatment', endodonticTreatmentRouter)
// Rutas para cirugías patologia
app.use('/api/cirugia-patologia', cirugiaPatologiaRouter)
// Rutas para periodoncia
app.use('/api/periodoncia', periodonciaRouter)
// Rutas para ortodoncia
app.use('/api/ortodoncia', ortodonciaRouter)
// Rutas para evolución ortodoncia
app.use('/api/evolucion-ortodoncia', evolucionOrtodonciaRouter)
// Rutas para rehabilitación oral
app.use('/api/rehabilitacion-oral', rehabilitacionOralRouter)
// Rutas para disfunción mandibular
app.use('/api/disfuncion-mandibular', disfuncionMandibularRouter)
// Rutas para consentimientos
app.use('/api/consentimiento', consentimientoRouter)
// Rutas para odontólogo
app.use('/api/odontologos', odontologoRouter)
//
app.use('/api/appointments', appointmentsRouter)
// Middleware para manejar errores 404
app.use(notFound)
// Middleware para manejar errores generales
app.use(handleErrors)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

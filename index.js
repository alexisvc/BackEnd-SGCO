require('dotenv').config()
require('./mongo')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const app = express()

const notFound = require('./middleware/notFound')
const handleErrors = require('./middleware/handleErrors')
const { scheduleDailyReminders } = require('./reminderScheduler')
const limiter = require('./middleware/express-rate-limit')

// Importar controladores
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
const budgetsRouter = require('./controllers/budgets')
const paymentsRouter = require('./controllers/payments')
const financialReportsRouter = require('./controllers/financialReports')
const contractPlansRouter = require('./controllers/contractPlans')

// app.use(cors())

const corsOptions = {
  origin: 'https://sghc-mp.netlify.app', // PROD
  // origin: 'http://localhost:5173', // DEV
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

app.use(helmet())
app.use(helmet.xssFilter())
app.use(helmet.frameguard({ action: 'deny' }))

app.use(express.json())

app.use(limiter)

app.get('/', (req, res) => {
  res.send('<h1>Bienvenido a mi SGCO</h1>')
})

// uploads
// app.use('/uploads', cors(corsOptions), express.static('uploads'))

app.use('/uploads', cors(corsOptions), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static('uploads'))

// Carpeta para los contratos
app.use('/uploads/contracts', cors(corsOptions), (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static('uploads/contracts'))

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
// Rutas para Citas
app.use('/api/appointments', appointmentsRouter)
// Rutas para Presupuestos
app.use('/api/budgets', budgetsRouter) // Nueva ruta para presupuestos
// Rutas para Pagos
app.use('/api/payments', paymentsRouter)
// Rutas para Reporte Consoldiado
app.use('/api/financial-reports', financialReportsRouter)
// Rutas para Contrato Planificacion
app.use('/api/contracts', contractPlansRouter)

// Middleware para manejar errores 404
app.use(notFound)
// Middleware para manejar errores generales
app.use(handleErrors)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  scheduleDailyReminders() // Ejecutar el cron job para recordatorios
})

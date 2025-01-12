const cron = require('node-cron')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc') // Plugin para manejar UTC
dayjs.extend(utc)
const axios = require('axios')
const Appointment = require('./models/Appointment') // Asegúrate que la ruta sea correcta

// Función para obtener las citas del día siguiente
const getTomorrowAppointments = async () => {
  // Solo obtener la fecha de mañana (sin hora)
  const tomorrowDate = dayjs().add(1, 'day').format('YYYY-MM-DD') // Fecha de mañana en formato YYYY-MM-DD

  console.log(`Buscando citas para la fecha: ${tomorrowDate}`) // Imprimir la fecha que se está buscando

  // Buscar citas cuyo campo "fecha" coincida con la fecha de mañana
  const appointments = await Appointment.find({
    // Convertimos la fecha en la base de datos a formato YYYY-MM-DD y comparamos con tomorrowDate
    fecha: {
      $eq: tomorrowDate
    }
  }).populate('paciente', 'nombrePaciente telefono apiKey')
    .populate('odontologo', 'nombreOdontologo')

  return appointments
}

// Función para enviar un mensaje por WhatsApp usando Callmebot
const sendWhatsAppMessage = async (phone, message, apiKey) => {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`
  try {
    const response = await axios.get(url)
    console.log(`Mensaje enviado a ${phone}: ${response.data}`)
  } catch (error) {
    console.error(`Error al enviar el mensaje a ${phone}:`, error.message)
  }
}

// Función para enviar los recordatorios
const sendAppointmentReminders = async () => {
  try {
    const appointments = await getTomorrowAppointments()

    if (appointments.length > 0) {
      console.log(`Se encontraron ${appointments.length} citas para enviar recordatorios.`)
    } else {
      console.log('No se encontraron citas para enviar recordatorios.')
    }

    appointments.forEach(async (appointment) => {
      const patient = appointment.paciente

      // Tomamos solo la parte de la fecha (sin la hora) en UTC
      const appointmentDate = dayjs(appointment.fecha).utc().format('YYYY-MM-DD')

      // Imprimir los detalles de la cita que está siendo verificada
      console.log(`Verificando cita de ${patient.nombrePaciente} con el ${appointment.odontologo.nombreOdontologo}. Fecha (solo fecha en UTC): ${appointmentDate}.`)

      const message = `Hola ${patient.nombrePaciente}, tienes una cita con el ${appointment.odontologo.nombreOdontologo} el ${appointmentDate} a las ${appointment.horaInicio}. Por favor, no faltes.`

      if (patient.telefono && patient.apiKey) {
        await sendWhatsAppMessage(patient.telefono, message, patient.apiKey)
      } else {
        console.log(`Paciente ${patient.nombrePaciente} no tiene número de teléfono o apiKey para enviar un mensaje.`)
      }
    })
  } catch (error) {
    console.error('Error al enviar recordatorios:', error)
  }
}

// Configuración del cron job para ejecutar todos los días a las
const scheduleDailyReminders = () => {
  // cron.schedule('47 23 * * *', async () => {
  cron.schedule('0 18 * * *', async () => {
    console.log('Cron job ejecutado: verificando citas para enviar recordatorios...')
    await sendAppointmentReminders()
  })
}

module.exports = {
  scheduleDailyReminders
}

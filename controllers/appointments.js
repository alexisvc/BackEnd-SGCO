const express = require('express')
const appointmentsRouter = express.Router()
const Appointment = require('../models/Appointment')
const Patient = require('../models/Patient')
const Odontologo = require('../models/Odontologo')

// Función para verificar si un odontólogo está disponible a una hora específica
const isOdontologoAvailable = async (odontologoId, fecha, hora) => {
  const appointment = await Appointment.findOne({ odontologo: odontologoId, fecha, hora })
  return !appointment // Retorna verdadero si no hay una cita ya agendada
}
// Función para verificar si un paciente está disponible a una hora específica
const isPacienteAvailable = async (pacienteId, fecha, hora) => {
  const appointment = await Appointment.findOne({ paciente: pacienteId, fecha, hora })
  return !appointment // Retorna verdadero si no hay una cita ya agendada
}

// Ruta para obtener todas las citas
appointmentsRouter.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('paciente', 'nombrePaciente _id')
      .populate('odontologo', 'nombreOdontologo especialidad _id')
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener una cita por ID
appointmentsRouter.get('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id
    const appointment = await Appointment.findById(appointmentId)
      .populate('paciente', 'nombrePaciente _id')
      .populate('odontologo', 'nombreOdontologo especialidad _id')
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }
    res.json(appointment)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener todas las citas de un odontólogo
appointmentsRouter.get('/odontologo/:odontologoId', async (req, res) => {
  try {
    const odontologoId = req.params.odontologoId
    const appointments = await Appointment.find({ odontologo: odontologoId })
      .populate('paciente', 'nombrePaciente _id')
      .populate('odontologo', 'nombreOdontologo especialidad _id')
    if (appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for this odontólogo' })
    }
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener todas las citas de un paciente
appointmentsRouter.get('/paciente/:pacienteId', async (req, res) => {
  try {
    const pacienteId = req.params.pacienteId
    const appointments = await Appointment.find({ paciente: pacienteId })
      .populate('paciente', 'nombrePaciente _id')
      .populate('odontologo', 'nombreOdontologo especialidad _id')
    if (appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for this paciente' })
    }
    res.json(appointments)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para obtener las horas ocupadas de un odontólogo en una fecha específica
appointmentsRouter.get('/horas-ocupadas/:odontologoId/:fecha', async (req, res) => {
  try {
    const { odontologoId, fecha } = req.params
    const appointments = await Appointment.find({ odontologo: odontologoId, fecha })

    // Extraer las horas ocupadas de las citas
    const horasOcupadas = appointments.map(app => app.hora)
    res.json(horasOcupadas)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para crear una nueva cita
appointmentsRouter.post('/', async (req, res) => {
  try {
    const { paciente, odontologo, fecha, hora } = req.body

    // Validaciones básicas
    if (!paciente || !odontologo || !fecha || !hora) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Verificar si el paciente y odontólogo existen
    const existingPatient = await Patient.findById(paciente)
    const existingOdontologo = await Odontologo.findById(odontologo)

    if (!existingPatient || !existingOdontologo) {
      return res.status(404).json({ error: 'Paciente or Odontólogo not found' })
    }

    // Verificar la disponibilidad del odontólogo
    const odontologoAvailable = await isOdontologoAvailable(odontologo, fecha, hora)
    if (!odontologoAvailable) {
      return res.status(400).json({ error: 'Odontólogo not available at this time' })
    }

    // Verificar la disponibilidad del paciente
    const pacienteAvailable = await isPacienteAvailable(paciente, fecha, hora)
    if (!pacienteAvailable) {
      return res.status(400).json({ error: 'Paciente already has an appointment at this time' })
    }

    // Crear la cita
    const appointment = new Appointment({
      paciente,
      odontologo,
      fecha,
      hora
    })

    const savedAppointment = await appointment.save()
    res.status(201).json(savedAppointment)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para actualizar una cita por ID
appointmentsRouter.put('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { paciente, odontologo, fecha, hora } = req.body

    // Verificar si la cita existe
    const existingAppointment = await Appointment.findById(appointmentId)
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    // Verificar si el odontólogo está disponible en la nueva fecha y hora
    if (odontologo && fecha && hora) {
      const available = await isOdontologoAvailable(odontologo, fecha, hora)
      if (!available) {
        return res.status(400).json({ error: 'Odontólogo not available at this time' })
      }
    }

    // Actualizar la cita
    existingAppointment.paciente = paciente || existingAppointment.paciente
    existingAppointment.odontologo = odontologo || existingAppointment.odontologo
    existingAppointment.fecha = fecha || existingAppointment.fecha
    existingAppointment.hora = hora || existingAppointment.hora

    const updatedAppointment = await existingAppointment.save()
    res.json(updatedAppointment)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Ruta para eliminar una cita
appointmentsRouter.delete('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id
    const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId)

    if (!deletedAppointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = appointmentsRouter

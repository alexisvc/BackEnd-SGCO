const express = require('express')
const appointmentsRouter = express.Router()
const Appointment = require('../models/Appointment')

const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
dayjs.extend(isBetween)

// Función para verificar si un odontólogo está disponible a una hora específica
/*
const isOdontologoAvailable = async (odontologoId, fecha, hora) => {
  const appointment = await Appointment.findOne({ odontologo: odontologoId, fecha, hora })
  return !appointment // Retorna verdadero si no hay una cita ya agendada
}

// Función para verificar si un paciente está disponible a una hora específica
const isPacienteAvailable = async (pacienteId, fecha, hora) => {
  const appointment = await Appointment.findOne({ paciente: pacienteId, fecha, hora })
  return !appointment // Retorna verdadero si no hay una cita ya agendada
}
*/
/*
const isOdontologoAvailable = async (odontologoId, fecha, horaInicio, horaFin) => {
  const appointments = await Appointment.find({ odontologo: odontologoId, fecha })
  // Verificar si alguna cita se solapa con el rango dado
  return !appointments.some(app => {
    const start = dayjs(app.horaInicio, 'HH:mm')
    const end = dayjs(app.horaFin, 'HH:mm')
    const newStart = dayjs(horaInicio, 'HH:mm')
    const newEnd = dayjs(horaFin, 'HH:mm')

    // Verificar si hay solapamiento
    return newStart.isBefore(end) && newEnd.isAfter(start)
  })
}

// Verificar si un paciente está disponible en un rango de tiempo
const isPacienteAvailable = async (pacienteId, fecha, horaInicio, horaFin) => {
  const appointments = await Appointment.find({ paciente: pacienteId, fecha })

  // Verificar si alguna cita se solapa con el rango dado
  return !appointments.some(app => {
    const start = dayjs(app.horaInicio, 'HH:mm')
    const end = dayjs(app.horaFin, 'HH:mm')
    const newStart = dayjs(horaInicio, 'HH:mm')
    const newEnd = dayjs(horaFin, 'HH:mm')

    // Verificar si hay solapamiento
    return newStart.isBefore(end) && newEnd.isAfter(start)
  })
}
*/
// Función mejorada para verificar si hay solapamiento de citas
const isOverlapping = async (odontologoId, fecha, horaInicio, horaFin, excludeAppointmentId = null) => {
  console.log(`Verificando solapamiento para: ${odontologoId}, ${fecha}, ${horaInicio}-${horaFin}, excluyendo: ${excludeAppointmentId}`)

  const appointments = await Appointment.find({
    odontologo: odontologoId,
    fecha: new Date(fecha), // Asegurarse de que la fecha se compara correctamente
    _id: { $ne: excludeAppointmentId }
  }).populate('paciente', 'nombrePaciente')

  console.log(`Citas encontradas para comparar: ${appointments.length}`)

  const newStart = dayjs(`${fecha}T${horaInicio}`)
  const newEnd = dayjs(`${fecha}T${horaFin}`)

  for (const appointment of appointments) {
    console.log(`Comparando con cita: ${appointment._id}`)
    const existingStart = dayjs(`${fecha}T${appointment.horaInicio}`)
    const existingEnd = dayjs(`${fecha}T${appointment.horaFin}`)

    if (
      (newStart.isAfter(existingStart) && newStart.isBefore(existingEnd)) ||
      (newEnd.isAfter(existingStart) && newEnd.isBefore(existingEnd)) ||
      (newStart.isBefore(existingStart) && newEnd.isAfter(existingEnd)) ||
      newStart.isSame(existingStart) ||
      newEnd.isSame(existingEnd)
    ) {
      console.log(`Solapamiento detectado con cita: ${appointment._id}`)
      return {
        isOverlapping: true,
        overlappingAppointment: {
          paciente: appointment.paciente.nombrePaciente,
          horaInicio: appointment.horaInicio,
          horaFin: appointment.horaFin
        }
      }
    }
  }

  console.log('No se detectó solapamiento')
  return { isOverlapping: false }
}

// Modificar el middleware validateAppointmentData
const validateAppointmentData = (req, res, next) => {
  const { paciente, odontologo, fecha, horaInicio, horaFin } = req.body

  if (!paciente || !odontologo || !fecha || !horaInicio || !horaFin) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  // Validar formato de fecha y horas
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

  if (!dateRegex.test(fecha) || !timeRegex.test(horaInicio) || !timeRegex.test(horaFin)) {
    return res.status(400).json({ error: 'Formato de fecha u hora inválido' })
  }

  // Validar que la hora de fin sea posterior a la hora de inicio
  if (dayjs(`${fecha}T${horaFin}`).isBefore(dayjs(`${fecha}T${horaInicio}`))) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' })
  }

  next()
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
/*
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
*/
// Ruta para crear una nueva cita
appointmentsRouter.post('/', validateAppointmentData, async (req, res) => {
  try {
    const { paciente, odontologo, fecha, horaInicio, horaFin } = req.body

    console.log(`Intentando crear cita: ${JSON.stringify(req.body)}`)

    const overlapResult = await isOverlapping(odontologo, fecha, horaInicio, horaFin)
    if (overlapResult.isOverlapping) {
      const { paciente, horaInicio, horaFin } = overlapResult.overlappingAppointment
      console.log(`Solapamiento detectado para la cita: ${JSON.stringify(req.body)}`)
      return res.status(400).json({
        error: `El odontólogo no está disponible en el horario seleccionado. Se solapa con una cita existente del paciente ${paciente} de ${horaInicio} a ${horaFin}.`
      })
    }

    // Calcular la duración
    const start = dayjs(`${fecha}T${horaInicio}`)
    const end = dayjs(`${fecha}T${horaFin}`)
    const duracion = end.diff(start, 'minute')

    const appointment = new Appointment({
      paciente,
      odontologo,
      fecha,
      horaInicio,
      horaFin,
      duracion
    })

    const savedAppointment = await appointment.save()
    console.log(`Cita creada exitosamente: ${JSON.stringify(savedAppointment)}`)
    res.status(201).json(savedAppointment)
  } catch (error) {
    console.error('Error al crear la cita:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
})

// Ruta para actualizar una cita
appointmentsRouter.put('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { paciente, odontologo, fecha, horaInicio, horaFin } = req.body

    console.log(`Intentando actualizar cita ${appointmentId}:`, req.body)

    const existingAppointment = await Appointment.findById(appointmentId)
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    const overlapResult = await isOverlapping(odontologo, fecha, horaInicio, horaFin, appointmentId)
    if (overlapResult.isOverlapping) {
      const { paciente, horaInicio, horaFin } = overlapResult.overlappingAppointment
      console.log(`Solapamiento detectado para la actualización de la cita ${appointmentId}:`, req.body)
      return res.status(400).json({
        error: `El odontólogo no está disponible en el horario seleccionado. Se solapa con una cita existente del paciente ${paciente} de ${horaInicio} a ${horaFin}.`
      })
    }

    existingAppointment.paciente = paciente
    existingAppointment.odontologo = odontologo
    existingAppointment.fecha = new Date(fecha)
    existingAppointment.horaInicio = horaInicio
    existingAppointment.horaFin = horaFin

    const updatedAppointment = await existingAppointment.save()
    console.log('Cita actualizada exitosamente:', updatedAppointment)
    res.json(updatedAppointment)
  } catch (error) {
    console.error('Error al actualizar la cita:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
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

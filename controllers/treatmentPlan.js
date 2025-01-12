const express = require('express')
const mongoose = require('mongoose')
const treatmentPlansRouter = express.Router()
const TreatmentPlan = require('../models/TreatmentPlan')
const Patient = require('../models/Patient')
const Budget = require('../models/Budget')

const authMiddleware = require('../middleware/authMiddleware') // Importa el middleware de autenticación

// Aplica el middleware a todas las rutas
treatmentPlansRouter.use(authMiddleware)

// Middleware de validación
const validateTreatmentPlan = (req, res, next) => {
  const { paciente, especialidad, actividades } = req.body

  // Validar campos requeridos básicos
  if (!paciente || !especialidad || !actividades) {
    return res.status(400).json({
      error: 'Todos los campos son requeridos',
      details: {
        paciente: !paciente,
        especialidad: !especialidad,
        actividades: !actividades
      }
    })
  }

  // Validar que actividades sea un array y tenga al menos un elemento
  if (!Array.isArray(actividades) || actividades.length === 0) {
    return res.status(400).json({
      error: 'La planificación debe tener al menos una actividad'
    })
  }

  // Validar cada actividad
  for (const actividad of actividades) {
    if (!actividad.cita || !actividad.actividadPlanTrat || !actividad.fechaPlanTrat) {
      return res.status(400).json({
        error: 'Cada actividad debe tener cita, descripción y fecha'
      })
    }

    // Validar que la fecha sea válida
    if (!Date.parse(actividad.fechaPlanTrat)) {
      return res.status(400).json({
        error: 'La fecha proporcionada no es válida'
      })
    }

    // Validar monto de abono si existe
    if (actividad.montoAbono && typeof actividad.montoAbono === 'number' && actividad.montoAbono < 0) {
      return res.status(400).json({
        error: 'El monto de abono no puede ser negativo'
      })
    }

    // Validar estado
    if (actividad.estado && !['pendiente', 'en-proceso', 'completado'].includes(actividad.estado)) {
      return res.status(400).json({
        error: 'Estado de actividad no válido'
      })
    }
  }

  next()
}

// Obtener todos los planes de tratamiento
treatmentPlansRouter.get('/', async (req, res) => {
  try {
    const treatmentPlans = await TreatmentPlan.find()
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })
    res.json(treatmentPlans)
  } catch (error) {
    console.error('Error al obtener planes de tratamiento:', error)
    res.status(500).json({ error: 'Error al obtener los planes de tratamiento' })
  }
})

// Obtener planes de tratamiento por ID de paciente
treatmentPlansRouter.get('/patient/:patientId', async (req, res) => {
  console.log('pacienteId recibido:', req.params.patientId)
  try {
    const { patientId } = req.params
    const treatments = await TreatmentPlan.find({ paciente: patientId })
      .populate('paciente')

    res.json(treatments)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener los planes del paciente' })
  }
})

// Obtener un plan específico por ID
treatmentPlansRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log('ID recibido:', id, 'Tipo:', typeof id)

    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de planificación no válido' })
    }

    // Validar que el ID tenga el formato correcto de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ID no válido para MongoDB:', id)
      return res.status(400).json({ error: 'Formato de ID no válido' })
    }

    const treatment = await TreatmentPlan.findById(id)
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })

    console.log('Treatment encontrado:', treatment)

    if (!treatment) {
      return res.status(404).json({ error: 'Plan de tratamiento no encontrado' })
    }

    res.json(treatment)
  } catch (error) {
    console.error('Error detallado:', {
      message: error.message,
      stack: error.stack,
      details: error
    })
    res.status(500).json({ error: 'Error al obtener el plan de tratamiento' })
  }
})

// Crear nuevo plan de tratamiento
treatmentPlansRouter.post('/', validateTreatmentPlan, async (req, res) => {
  try {
    console.log('Datos recibidos en backend:', req.body)
    const { paciente, especialidad, actividades } = req.body

    const existingPatient = await Patient.findById(paciente)
    if (!existingPatient) {
      return res.status(404).json({ error: 'Paciente no encontrado' })
    }

    const treatment = new TreatmentPlan({
      paciente,
      especialidad,
      actividades: actividades.map(act => ({
        ...act,
        estado: act.estado || 'pendiente'
      }))
    })

    const savedTreatment = await treatment.save()
    const populatedTreatment = await TreatmentPlan.findById(savedTreatment._id)
      .populate('paciente')

    res.status(201).json(populatedTreatment)
  } catch (error) {
    console.error('Error en backend:', error)
    res.status(500).json({ error: 'Error al crear la planificación' })
  }
})

// Agregar actividad a una planificación existente
treatmentPlansRouter.post('/:id/actividades', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id)
    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    treatment.actividades.push(req.body)
    const updatedTreatment = await treatment.save()

    res.json(updatedTreatment)
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar actividad' })
  }
})

// Actualizar una actividad específica
treatmentPlansRouter.patch('/:id/actividades/:actividadIndex', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id)
    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    const actividadIndex = parseInt(req.params.actividadIndex)
    if (actividadIndex >= treatment.actividades.length) {
      return res.status(404).json({ error: 'Actividad no encontrada' })
    }

    treatment.actividades[actividadIndex] = {
      ...treatment.actividades[actividadIndex],
      ...req.body
    }

    const updatedTreatment = await treatment.save()
    res.json(updatedTreatment)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la actividad' })
  }
})

treatmentPlansRouter.patch('/:id/actividades/:actividadIndex/estado', async (req, res) => {
  try {
    const { estado } = req.body
    const treatment = await TreatmentPlan.findById(req.params.id)

    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    const actividadIndex = parseInt(req.params.actividadIndex)
    if (!treatment.actividades[actividadIndex]) {
      return res.status(404).json({ error: 'Actividad no encontrada' })
    }

    treatment.actividades[actividadIndex].estado = estado
    const updatedTreatment = await treatment.save()

    res.json(updatedTreatment)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar estado de la actividad' })
  }
})

// Actualizar plan de tratamiento
treatmentPlansRouter.put('/:id', validateTreatmentPlan, async (req, res) => {
  try {
    const existingTreatment = await TreatmentPlan.findById(req.params.id)
    if (!existingTreatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    const updateData = {
      ...req.body,
      paciente: req.body.paciente || existingTreatment.paciente
    }

    const updatedTreatment = await TreatmentPlan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 })

    res.json(updatedTreatment)
  } catch (error) {
    console.error('Error al actualizar planificación:', error)
    res.status(500).json({ error: 'Error al actualizar la planificación' })
  }
})

// Eliminar una actividad
treatmentPlansRouter.delete('/:id/actividades/:actividadIndex', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id)
    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    treatment.actividades.splice(parseInt(req.params.actividadIndex), 1)
    await treatment.save()
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la actividad' })
  }
})

// Eliminar plan de tratamiento
treatmentPlansRouter.delete('/:id', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id)
    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' })
    }

    // Verificar si tiene presupuesto asociado
    const relatedBudget = await Budget.findOne({ treatmentPlan: treatment._id })
    if (relatedBudget) {
      return res.status(400).json({
        error: 'No se puede eliminar la planificación porque tiene un presupuesto asociado'
      })
    }

    await TreatmentPlan.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la planificación' })
  }
})

module.exports = treatmentPlansRouter

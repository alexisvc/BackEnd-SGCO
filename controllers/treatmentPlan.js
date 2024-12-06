const express = require('express')
const treatmentPlansRouter = express.Router()
const TreatmentPlan = require('../models/TreatmentPlan')
const Patient = require('../models/Patient')

// Obtener todos los planes de tratamiento
treatmentPlansRouter.get('/', async (req, res) => {
  try {
    const treatmentPlans = await TreatmentPlan.find()
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });
    res.json(treatmentPlans);
  } catch (error) {
    console.error('Error al obtener planes de tratamiento:', error);
    res.status(500).json({ error: 'Error al obtener los planes de tratamiento' });
  }
});

// Obtener planes de tratamiento por ID de paciente
treatmentPlansRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const treatments = await TreatmentPlan.find({ 
      paciente: req.params.patientId 
    }).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });
    res.json(treatments);
  } catch (error) {
    console.error('Error al obtener planes del paciente:', error);
    res.status(500).json({ error: 'Error al obtener los planes del paciente' });
  }
});

// Obtener un plan específico por ID
treatmentPlansRouter.get('/:id', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id)
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });
    
    if (!treatment) {
      return res.status(404).json({ error: 'Plan de tratamiento no encontrado' });
    }
    
    res.json(treatment);
  } catch (error) {
    console.error('Error al obtener plan de tratamiento:', error);
    res.status(500).json({ error: 'Error al obtener el plan de tratamiento' });
  }
});

// Crear nuevo plan de tratamiento
treatmentPlansRouter.post('/', async (req, res) => {
  console.log('Received treatment data:', req.body);
  try {
    const { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, paciente } = req.body;

    // Verificar que existe el paciente
    const existingPatient = await Patient.findById(paciente);
    if (!existingPatient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const treatment = new TreatmentPlan({
      cita,
      actividadPlanTrat,
      fechaPlanTrat,
      montoAbono,
      paciente
    });

    const savedTreatment = await treatment.save();
    
    // Agregar referencia al paciente
    existingPatient.treatmentPlans = existingPatient.treatmentPlans.concat(savedTreatment._id);
    await existingPatient.save();

    const populatedTreatment = await TreatmentPlan.findById(savedTreatment._id)
      .populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });

    res.status(201).json(populatedTreatment);
  } catch (error) {
    console.error('Error al crear plan de tratamiento:', error);
    res.status(500).json({ error: 'Error al crear el plan de tratamiento' });
  }
});

// Actualizar plan de tratamiento
treatmentPlansRouter.put('/:id', async (req, res) => {
  try {
    const { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, estado } = req.body;

    const updatedTreatment = await TreatmentPlan.findByIdAndUpdate(
      req.params.id,
      { cita, actividadPlanTrat, fechaPlanTrat, montoAbono, estado },
      { new: true, runValidators: true }
    ).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });

    if (!updatedTreatment) {
      return res.status(404).json({ error: 'Plan de tratamiento no encontrado' });
    }

    res.json(updatedTreatment);
  } catch (error) {
    console.error('Error al actualizar plan de tratamiento:', error);
    res.status(500).json({ error: 'Error al actualizar el plan de tratamiento' });
  }
});

// Eliminar plan de tratamiento
treatmentPlansRouter.delete('/:id', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ error: 'Plan de tratamiento no encontrado' });
    }

    // Eliminar referencia del paciente
    const patient = await Patient.findById(treatment.paciente);
    if (patient) {
      patient.treatmentPlans = patient.treatmentPlans.filter(
        id => id.toString() !== treatment._id.toString()
      );
      await patient.save();
    }

    await TreatmentPlan.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar plan de tratamiento:', error);
    res.status(500).json({ error: 'Error al eliminar el plan de tratamiento' });
  }
});

module.exports = treatmentPlansRouter;
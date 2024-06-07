const express = require('express');
const patientsRouter = express.Router();
const Patient = require('../models/Patient');

// Ruta para obtener todos los pacientes
patientsRouter.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().populate('medicalRecords');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para obtener un paciente por su ID
patientsRouter.get('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para obtener un paciente por número de cédula
patientsRouter.get('/cedula/:numeroCedula', async (req, res) => {
  try {
    const numeroCedula = req.params.numeroCedula;
    const patient = await Patient.findOne({ numeroCedula });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para registrar un nuevo paciente
patientsRouter.post('/', async (req, res) => {
  try {
    const {
      nombrePaciente,
      edadPaciente,
      fechaNacimiento,
      correoPaciente,
      direccionPaciente,
      generoPaciente,
      numeroCedula,
      ocupacion,
      telefono,
      telContactoEmergencia,
      afinidadContactoEmergencia,
    } = req.body;

    if (!nombrePaciente || !edadPaciente || !fechaNacimiento || !correoPaciente || !direccionPaciente || !generoPaciente || !numeroCedula || !ocupacion || !telefono || !telContactoEmergencia || !afinidadContactoEmergencia) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const patient = new Patient({
      nombrePaciente,
      edadPaciente,
      fechaNacimiento,
      correoPaciente,
      direccionPaciente,
      generoPaciente,
      numeroCedula,
      ocupacion,
      telefono,
      telContactoEmergencia,
      afinidadContactoEmergencia
    });

    const savedPatient = await patient.save();
    res.json(savedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para actualizar un paciente por su ID
patientsRouter.put('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      nombrePaciente,
      edadPaciente,
      fechaNacimiento,
      correoPaciente,
      direccionPaciente,
      generoPaciente,
      numeroCedula,
      ocupacion,
      telefono,
      telContactoEmergencia,
      afinidadContactoEmergencia
    } = req.body;

    const existingPatient = await Patient.findById(patientId);
    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (nombrePaciente) existingPatient.nombrePaciente = nombrePaciente;
    if (edadPaciente) existingPatient.edadPaciente = edadPaciente;
    if (fechaNacimiento) existingPatient.fechaNacimiento = fechaNacimiento;
    if (correoPaciente) existingPatient.correoPaciente = correoPaciente;
    if (direccionPaciente) existingPatient.direccionPaciente = direccionPaciente;
    if (generoPaciente) existingPatient.generoPaciente = generoPaciente;
    if (numeroCedula) existingPatient.numeroCedula = numeroCedula;
    if (ocupacion) existingPatient.ocupacion = ocupacion;
    if (telefono) existingPatient.telefono = telefono;
    if (telContactoEmergencia) existingPatient.telContactoEmergencia = telContactoEmergencia;
    if (afinidadContactoEmergencia) existingPatient.afinidadContactoEmergencia = afinidadContactoEmergencia;

    const updatedPatient = await existingPatient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para eliminar un paciente por su ID
patientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedPatient = await Patient.findByIdAndDelete(id);

    if (!deletedPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = patientsRouter;

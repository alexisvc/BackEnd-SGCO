const express = require('express');
const endodonticTreatmentRouter = express.Router();
const EndodonticTreatment = require('../models/EndodonticTreatment');
const Patient = require('../models/Patient');

// Route to get all endodontic treatments
endodonticTreatmentRouter.get('/', async (req, res) => {
  try {
    const endodonticTreatments = await EndodonticTreatment.find().populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });
    res.json(endodonticTreatments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get an endodontic treatment by ID
endodonticTreatmentRouter.get('/:id', async (req, res) => {
  try {
    const endodonticTreatmentId = req.params.id;
    const endodonticTreatment = await EndodonticTreatment.findById(endodonticTreatmentId).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });

    if (!endodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' });
    }

    res.json(endodonticTreatment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to get all endodontic treatments by patient ID
endodonticTreatmentRouter.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const endodonticTreatments = await EndodonticTreatment.find({ paciente: patientId }).populate('paciente', { nombrePaciente: 1, numeroCedula: 1 });

    res.json(endodonticTreatments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to create a new endodontic treatment
endodonticTreatmentRouter.post('/', async (req, res) => {
  try {
    const { paciente, ...endodonticTreatmentData } = req.body;

    // Validate that the patient exists
    const existingPatient = await Patient.findById(paciente);
    if (!existingPatient) {
      return res.status(400).json({ error: 'Patient not found' });
    }

    // Check if the patient already has an endodontic treatment record
    const existingTreatment = await EndodonticTreatment.findOne({ paciente });
    if (existingTreatment) {
      return res.status(400).json({ error: 'Patient already has an endodontic treatment' });
    }

    const endodonticTreatment = new EndodonticTreatment({
      paciente,
      ...endodonticTreatmentData
    });

    const savedEndodonticTreatment = await endodonticTreatment.save();

    // Add the endodontic treatment reference to the patient
    existingPatient.endodoncia = savedEndodonticTreatment._id;
    await existingPatient.save();

    res.status(201).json(savedEndodonticTreatment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to update an endodontic treatment by ID
endodonticTreatmentRouter.put('/:id', async (req, res) => {
  try {
    const endodonticTreatmentId = req.params.id;
    const { paciente, ...endodonticTreatmentData } = req.body;

    // Validate that the patient exists if updating the patient field
    if (paciente) {
      const existingPatient = await Patient.findById(paciente);
      if (!existingPatient) {
        return res.status(400).json({ error: 'Patient not found' });
      }
    }

    const updatedEndodonticTreatment = await EndodonticTreatment.findByIdAndUpdate(
      endodonticTreatmentId,
      { paciente, ...endodonticTreatmentData },
      { new: true, runValidators: true }
    );

    if (!updatedEndodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' });
    }

    res.json(updatedEndodonticTreatment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to delete an endodontic treatment by ID
endodonticTreatmentRouter.delete('/:id', async (req, res) => {
  try {
    const endodonticTreatmentId = req.params.id;

    const endodonticTreatment = await EndodonticTreatment.findById(endodonticTreatmentId);
    if (!endodonticTreatment) {
      return res.status(404).json({ error: 'Endodontic treatment not found' });
    }

    const patient = await Patient.findById(endodonticTreatment.paciente);
    if (patient) {
      patient.endodoncia = null;
      await patient.save();
    }

    await EndodonticTreatment.findByIdAndDelete(endodonticTreatmentId);

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = endodonticTreatmentRouter;

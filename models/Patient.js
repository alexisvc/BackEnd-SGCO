const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  nombrePaciente: {
    type: String,
    required: true
  },
  edadPaciente: {
    type: Number,
    required: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  correoPaciente: {
    type: String,
    required: true
  },
  direccionPaciente: {
    type: String,
    required: true
  },
  generoPaciente: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  numeroCedula: {
    type: String,
    required: true
  },
  ocupacion: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  telContactoEmergencia: {
    type: String,
    required: true
  },
  afinidadContactoEmergencia: {
    type: String,
    required: true
  },
  medicalRecords: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord'
    }
  ]
});

patientSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

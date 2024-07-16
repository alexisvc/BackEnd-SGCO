const mongoose = require('mongoose')

const rehabilitacionOralSchema = new mongoose.Schema({
  refHorizontal: [String],
  refVertical: [String],
  longitudLabio: [String],
  formaLabio: [String],
  exposicionSonrisa: [String],
  corredorBucal: [String],
  orientacionPlanoOclusalAnt: [String],
  visibilidadBordeSup: {
    type: String,
    trim: true
  },
  orientacionPlanoOclusalPost: [String],
  anchoIncisivoCentalSup: {
    type: String,
    trim: true
  },
  longitud: {
    type: String,
    trim: true
  },
  colorDientes: {
    type: String,
    trim: true
  },
  simetriaGingival: [String],
  biotipoPeriodental: [String],
  numeroDiente: [String],
  perdidaHuesoPeriodental: [String],
  otrasPatologiasOseas: {
    type: String,
    trim: true
  },
  restriccionViasRespiratorias: {
    type: String,
    trim: true
  },
  relacionIncisal: [String],
  overbite: [String],
  overjet: [String],
  tinitus: [String],
  puedeRepetirMordida: [String],
  restauracionesDefectuosas: [String],
  // restauracionesDefectuosas: Boolean,
  // restauracionesDefectuosasCuales: String,
  lesionesCariosas: [String],
  // lesionesCariosas: Boolean,
  // lesionesCariosasCuales: String,
  dientesFaltantes: [String],
  // dientesFaltantes: Boolean,
  // dientesFaltantesCuales: String,
  coronaDental: [String],
  // coronaDental: Boolean,
  // coronaDentalCuales: String,
  espigos: [String],
  // espigos: Boolean,
  // espigosCuales: String,
  implantes: [String],
  // implantes: Boolean,
  // implantesCuales: String,
  edentuloParcial: [String],
  clasificacionDeKenedy: {
    type: String,
    trim: true
  },
  edentuloTotal: [String],
  diagnosticoOclusal: {
    type: String,
    trim: true
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  }
})

rehabilitacionOralSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const RehabilitacionOral = mongoose.model('RehabilitacionOral', rehabilitacionOralSchema)

module.exports = RehabilitacionOral

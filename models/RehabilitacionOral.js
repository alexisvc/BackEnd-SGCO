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
  restauracionesDefectuosas: Boolean,
  restauracionesDefectuosasCuales: String,
  lesionesCariosas: Boolean,
  lesionesCariosasCuales: String,
  dientesFaltantes: Boolean,
  dientesFaltantesCuales: String,
  coronaDental: Boolean,
  coronaDentalCuales: String,
  espigos: Boolean,
  espigosCuales: String,
  espigos2: [String],
  implantes: Boolean,
  implantesCuales: String,
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
  },
  archivo1: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
  },
  archivo2: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
  },
  archivo3: {
    type: String, // Ruta o nombre del archivo guardado
    required: false // Puede ser opcional
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

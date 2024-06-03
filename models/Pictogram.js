const mongoose = require('mongoose')

// Definición del schema
const pictogramSchema = new mongoose.Schema({
  name: String,
  category: String,
  url: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})
// Transformar el objeto devuelto por Mongoose
pictogramSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

// Definición del modelo
const Pictogram = mongoose.model('Pictogram', pictogramSchema)

module.exports = Pictogram

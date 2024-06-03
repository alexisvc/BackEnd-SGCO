const mongoose = require('mongoose')

// Definición del schema
const uniqueValidator = require('mongoose-unique-validator')
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: String,
  passwordHash: String,
  pictograms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pictogram'
    }
  ]
})
// Transformar el objeto devuelto por Mongoose
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v

    delete returnedObject.passwordHash
  }
})

userSchema.plugin(uniqueValidator)

// Definición del modelo
const User = mongoose.model('User', userSchema)

module.exports = User

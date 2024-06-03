const mongoose = require('mongoose')

// Conexión a la base de datos
const connectionString = process.env.MONGO_DB_URI

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Conectado a la base de datos')
  })
  .catch((err) => {
    console.error(err)
  })
// Cerrar la conexión con la base de datos
process.on('uncaughtException', () => {
  mongoose.connection.close()
})

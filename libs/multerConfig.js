const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/consentimientos') // Directorio donde se guardarán los archivos de consentimientos
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}${ext}`) // Nombre único para el archivo basado en la fecha actual y extensión original
  }
})

const upload = multer({ storage })

module.exports = upload

const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images') // Directorio donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    cb(null, `${Date.now()}.${ext}`)
  }
})

const upload = multer({ storage })

module.exports = upload

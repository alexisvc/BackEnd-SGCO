const express = require('express')
const pictogramsRouter = express.Router()
const Pictogram = require('../models/Pictogram')
const User = require('../models/User')
const userExtractor = require('../middleware/userExtractor')
const upload = require('../libs/multerConfig')

// Obtener todos los pictogramas
pictogramsRouter.get('/', async (req, res) => {
  const pictograms = await Pictogram.find({}).populate('user', {
    username: 1,
    name: 1
  })
  res.json(pictograms)
})

// Obtener los pictogramas de un usuario por su ID
pictogramsRouter.get('/:userId', async (req, res, next) => {
  const userId = req.params.userId

  try {
    // Buscar los pictogramas asociados al usuario
    const pictograms = await Pictogram.find({ user: userId }).populate('user', {
      username: 1,
      name: 1
    })

    if (!pictograms) {
      return res.status(404).json({ error: 'No pictograms found for this user' })
    }

    res.json(pictograms)
  } catch (error) {
    next(error)
  }
})

// Obtener pictograma por id
pictogramsRouter.get('/:id', (req, res, next) => {
  const id = req.params.id
  Pictogram.findById(id).then((pictogram) => {
    if (pictogram) return res.json(pictogram)
    res.status(404).end()
  }).catch((error) => { next(error) })
})

// Crear pictograma con carga de imagen
pictogramsRouter.post('/', userExtractor, upload.single('image'), async (req, res, next) => {
  const { name, category } = req.body
  const { userId } = req

  if (!name || !category) {
    return res.status(400).json({
      error: 'Name and category are required'
    })
  }

  try {
    const imageUrl = `http://localhost:3001/images/${req.file.filename}` // Obtén el nombre del archivo cargado

    const newPictogram = new Pictogram({
      name,
      category,
      url: imageUrl,
      user: userId
    })

    const savedPictogram = await newPictogram.save()

    const user = await User.findById(userId)
    user.pictograms = user.pictograms.concat(savedPictogram._id)
    await user.save()

    res.json(savedPictogram)
  } catch (error) {
    next(error)
  }
})

pictogramsRouter.put('/:id', userExtractor, upload.single('image'), async (req, res, next) => {
  const id = req.params.id
  const { name, category } = req.body

  if (!name || !category) {
    return res.status(400).json({
      error: 'Name and category are required'
    })
  }

  try {
    let imageUrl = '' // Inicializamos imageUrl como una cadena vacía

    if (req.file) {
      // Si se cargó una nueva imagen, actualiza la URL de la imagen
      imageUrl = `http://localhost:3001/images/${req.file.filename}`
    } else {
      // Si no se cargó una nueva imagen, obtén la URL de la imagen existente
      const existingPictogram = await Pictogram.findById(id)
      if (existingPictogram) {
        imageUrl = existingPictogram.url
      } else {
        return res.status(404).json({ error: 'Pictogram not found' })
      }
    }

    const updatedPictogram = {
      name,
      category,
      url: imageUrl
    }

    const result = await Pictogram.findByIdAndUpdate(id, updatedPictogram, { new: true })

    if (!result) {
      return res.status(404).json({ error: 'Pictogram not found' })
    }

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// Eliminar pictograma
pictogramsRouter.delete('/:id', userExtractor, async (req, res, next) => {
  const id = req.params.id
  await Pictogram.findByIdAndDelete(id).then((result) => {
    res.status(204).end()
  }).catch((error) => {
    next(error)
  })
})

module.exports = pictogramsRouter

const budgetsRouter = require('express').Router();
const Budget = require('../models/Budget');

// Middleware para validar presupuesto
const validateBudgetData = (req, res, next) => {

  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  console.log('Tipo de body:', typeof req.body);

  const { paciente, especialidad, fases } = req.body;

  console.log('Paciente:', paciente);
  console.log('Especialidad:', especialidad);
  console.log('Fases:', fases);

  if (!paciente || !especialidad || !fases) {
    return res.status(400).json({ 
      error: 'Todos los campos son obligatorios',
      missing: {
        paciente: !paciente,
        especialidad: !especialidad,
        fases: !fases
      }
    });
  }

  if (!Array.isArray(fases) || fases.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos una fase' });
  }

  for (const fase of fases) {
    if (!fase.nombre || !fase.descripcion || !Array.isArray(fase.procedimientos)) {
      return res.status(400).json({ error: 'Información de fase incompleta' });
    }

    for (const proc of fase.procedimientos) {
      if (!proc.nombre || !proc.numeroPiezas || !proc.costoPorUnidad) {
        return res.status(400).json({ 
          error: 'Cada procedimiento debe incluir nombre, número de piezas y costo por unidad' 
        });
      }
      
      if (proc.numeroPiezas <= 0 || proc.costoPorUnidad < 0) {
        return res.status(400).json({ 
          error: 'El número de piezas debe ser positivo y el costo no puede ser negativo' 
        });
      }
    }
  }

  next();
};

// Obtener todos los presupuestos
budgetsRouter.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find().populate('paciente', 'nombrePaciente numeroCedula');
    res.json(budgets);
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    res.status(500).json({ error: 'Error al obtener los presupuestos' });
  }
});

// Obtener presupuestos por paciente
budgetsRouter.get('/paciente/:pacienteId', async (req, res) => {
  try {
    const budgets = await Budget.find({ paciente: req.params.pacienteId })
      .populate('paciente', 'nombrePaciente numeroCedula');
    
    if (!budgets.length) {
      return res.status(404).json({ error: 'No se encontraron presupuestos para este paciente' });
    }
    
    res.json(budgets);
  } catch (error) {
    console.error('Error al obtener presupuestos del paciente:', error);
    res.status(500).json({ error: 'Error al obtener los presupuestos del paciente' });
  }
});

// Obtener un presupuesto específico
budgetsRouter.get('/:id', async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id)
        .populate('paciente', 'nombrePaciente numeroCedula')
      
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      
      res.json(budget);
    } catch (error) {
      console.error('Error al obtener presupuesto:', error);
      res.status(500).json({ error: 'Error al obtener el presupuesto' });
    }
  });

// Crear nuevo presupuesto
budgetsRouter.post('/', validateBudgetData, async (req, res) => {
  try {
    const { paciente, especialidad, fases } = req.body;

    const newBudget = new Budget({
      paciente,
      especialidad,
      fases
    });

    const savedBudget = await newBudget.save();
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente', 'nombrePaciente numeroCedula');

    res.status(201).json(populatedBudget);
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ error: 'Error al crear el presupuesto' });
  }
});

// Actualizar estado del presupuesto
budgetsRouter.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!['borrador', 'emitido', 'aceptado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    ).populate('paciente', 'nombrePaciente numeroCedula');

    if (!updatedBudget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    res.json(updatedBudget);
  } catch (error) {
    console.error('Error al actualizar estado del presupuesto:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del presupuesto' });
  }
});

// Los demás endpoints permanecen igual, solo eliminando las referencias al odontólogo

// Actualizar procedimientos de una fase específica
budgetsRouter.patch('/:id/fase/:faseIndex/procedimientos', async (req, res) => {
    try {
      const { id, faseIndex } = req.params;
      const { procedimientos } = req.body;
  
      const budget = await Budget.findById(id);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
  
      if (faseIndex >= budget.fases.length) {
        return res.status(400).json({ error: 'Índice de fase inválido' });
      }
  
      budget.fases[faseIndex].procedimientos = procedimientos;
      const updatedBudget = await budget.save();
  
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error al actualizar procedimientos:', error);
      res.status(500).json({ error: 'Error al actualizar los procedimientos' });
    }
  });
  
  // Agregar un nuevo procedimiento a una fase
  budgetsRouter.post('/:id/fase/:faseIndex/procedimiento', async (req, res) => {
    try {
      const { id, faseIndex } = req.params;
      const nuevoProcedimiento = req.body;
  
      const budget = await Budget.findById(id);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
  
      if (faseIndex >= budget.fases.length) {
        return res.status(400).json({ error: 'Índice de fase inválido' });
      }
  
      budget.fases[faseIndex].procedimientos.push(nuevoProcedimiento);
      const updatedBudget = await budget.save();
  
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error al agregar procedimiento:', error);
      res.status(500).json({ error: 'Error al agregar el procedimiento' });
    }
  });

  // Actualizar un presupuesto
  budgetsRouter.put('/:id', validateBudgetData, async (req, res) => {
    try {
      const { id } = req.params;
      const budgetData = req.body;

      const updatedBudget = await Budget.findByIdAndUpdate(
        id,
        budgetData,
        { new: true, runValidators: true }
      ).populate('paciente', 'nombrePaciente numeroCedula');

      if (!updatedBudget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }

      res.json(updatedBudget);
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error);
      res.status(500).json({ error: 'Error al actualizar el presupuesto' });
    }
  });
  
  // Eliminar un presupuesto
  budgetsRouter.delete('/:id', async (req, res) => {
    try {
      const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
      
      if (!deletedBudget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      res.status(500).json({ error: 'Error al eliminar el presupuesto' });
    }
  });
  
  // Eliminar un procedimiento específico de una fase
  budgetsRouter.delete('/:id/fase/:faseIndex/procedimiento/:procedimientoIndex', async (req, res) => {
    try {
      const { id, faseIndex, procedimientoIndex } = req.params;
  
      const budget = await Budget.findById(id);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
  
      if (faseIndex >= budget.fases.length) {
        return res.status(400).json({ error: 'Índice de fase inválido' });
      }
  
      const fase = budget.fases[faseIndex];
      if (procedimientoIndex >= fase.procedimientos.length) {
        return res.status(400).json({ error: 'Índice de procedimiento inválido' });
      }
  
      fase.procedimientos.splice(procedimientoIndex, 1);
      const updatedBudget = await budget.save();
  
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error al eliminar procedimiento:', error);
      res.status(500).json({ error: 'Error al eliminar el procedimiento' });
    }
  });


module.exports = budgetsRouter;
const budgetsRouter = require('express').Router();
const Budget = require('../models/Budget');
const TreatmentPlan = require('../models/TreatmentPlan');

// Middleware para validar presupuesto
const validateBudgetData = async (req, res, next) => {

  console.log('Body recibido:', JSON.stringify(req.body, null, 2));
  console.log('Tipo de body:', typeof req.body);

  const { paciente, especialidad, fases, treatmentPlan  } = req.body;

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

  // Si viene un treatmentPlan, validar que no tenga presupuesto existente
  if (treatmentPlan) {
    const existingBudget = await Budget.findOne({ treatmentPlan });
    if (existingBudget) {
      return res.status(400).json({ 
        error: 'Ya existe un presupuesto para esta planificación' 
      });
    }
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
    const budgets = await Budget.find()
    .populate('paciente', 'nombrePaciente numeroCedula')
    .populate('treatmentPlan');
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
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan');
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
        .populate('treatmentPlan');
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
      
      res.json(budget);
    } catch (error) {
      console.error('Error al obtener presupuesto:', error);
      res.status(500).json({ error: 'Error al obtener el presupuesto' });
    }
  });

  // Nueva ruta para obtener presupuesto por planificación
budgetsRouter.get('/treatment/:treatmentPlanId', async (req, res) => {
  try {
    const budget = await Budget.findOne({ treatmentPlan: req.params.treatmentPlanId })
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan');

    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado para esta planificación' });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el presupuesto' });
  }
});

// Crear nuevo presupuesto
budgetsRouter.post('/', validateBudgetData, async (req, res) => {
  try {
    const { paciente, especialidad, fases, treatmentPlan } = req.body;
    console.log('Creating budget with treatment plan:', treatmentPlan);

    const newBudget = new Budget({
      paciente,
      especialidad,
      fases,
      treatmentPlan
    });

    const savedBudget = await newBudget.save();
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan');

    res.status(201).json(populatedBudget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Error al crear el presupuesto' });
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

budgetsRouter.post('/treatment/:treatmentId', validateBudgetData, async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const budgetData = req.body;

    const treatment = await TreatmentPlan.findById(treatmentId);
    if (!treatment) {
      return res.status(404).json({ error: 'Tratamiento no encontrado' });
    }

    const newBudget = new Budget({
      ...budgetData,
      paciente: treatment.paciente,
      treatmentPlan: treatmentId
    });

    const savedBudget = await newBudget.save();
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente')
      .populate('treatmentPlan');

    res.status(201).json(populatedBudget);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el presupuesto' });
  }
});

// Crear presupuesto desde una planificación
// Modificar la ruta de creación de presupuesto desde planificación
budgetsRouter.post('/from-treatment/:treatmentPlanId', async (req, res) => {
  try {
    const treatment = await TreatmentPlan.findById(req.params.treatmentPlanId)
      .populate('paciente');
      
    if (!treatment) {
      return res.status(404).json({ error: 'Planificación no encontrada' });
    }

    // Verificar si ya existe un presupuesto para esta planificación
    const existingBudget = await Budget.findOne({ treatmentPlan: treatment._id });
    if (existingBudget) {
      return res.status(400).json({ error: 'Ya existe un presupuesto para esta planificación' });
    }

    const budget = new Budget({
      paciente: treatment.paciente._id,
      especialidad: treatment.especialidad,
      treatmentPlan: treatment._id,
      fases: [{
        nombre: 'Fase Principal',
        descripcion: 'Actividades de la planificación',
        procedimientos: treatment.actividades.map(act => ({
          nombre: act.actividadPlanTrat,
          numeroPiezas: 1,
          costoPorUnidad: 0
        }))
      }]
    });

    const savedBudget = await budget.save();
    const populatedBudget = await Budget.findById(savedBudget._id)
      .populate('paciente', 'nombrePaciente numeroCedula')
      .populate('treatmentPlan');

    res.status(201).json(populatedBudget);
  } catch (error) {
    console.error('Error al crear presupuesto desde planificación:', error);
    res.status(500).json({ error: 'Error al crear el presupuesto' });
  }
});

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
  
  

  // Actualizar un presupuesto
  budgetsRouter.put('/:id', validateBudgetData, async (req, res) => {
    try {
      const { id } = req.params;
      const budgetData = req.body;
  
      const updatedBudget = await Budget.findByIdAndUpdate(
        id,
        budgetData,
        { new: true, runValidators: true }
      ).populate('paciente', 'nombrePaciente numeroCedula')
        .populate('treatmentPlan');
  
      if (!updatedBudget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
  
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error al actualizar presupuesto:', error);
      res.status(500).json({ error: 'Error al actualizar el presupuesto' });
    }
  });
  
  /// Eliminar un presupuesto

budgetsRouter.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({ error: 'Error al eliminar el presupuesto' });
  }
});


module.exports = budgetsRouter;
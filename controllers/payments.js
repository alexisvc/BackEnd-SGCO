const paymentsRouter = require('express').Router();
const Payment = require('../models/Payment');
const Budget = require('../models/Budget');
const FinancialReport = require('../models/FinancialReport');

// Obtener todos los pagos de un presupuesto con resumen
paymentsRouter.get('/budget/:budgetId/summary', async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.budgetId);
      if (!budget) {
        return res.status(404).json({ error: 'Presupuesto no encontrado' });
      }
  
      // Inicializar las fases del resumen basado en el presupuesto
      const resumenFases = budget.fases.map((fase, index) => {
        return {
          faseIndex: index,
          nombreFase: fase.nombre,
          totalFase: fase.total,
          totalPagado: 0, // Se actualizará con los pagos reales
          saldoPendiente: fase.total,
          pagos: []
        };
      });
  
      // Obtener los pagos existentes
      const paymentPhases = await Payment.find({ budget: req.params.budgetId })
        .sort('faseIndex');
  
      // Actualizar las fases con los pagos existentes
      paymentPhases.forEach(paymentPhase => {
        if (resumenFases[paymentPhase.faseIndex]) {
          const totalPagado = paymentPhase.pagos
            .filter(pago => !pago.anulado)
            .reduce((sum, pago) => sum + pago.monto, 0);
  
          resumenFases[paymentPhase.faseIndex].totalPagado = totalPagado;
          resumenFases[paymentPhase.faseIndex].saldoPendiente = 
            resumenFases[paymentPhase.faseIndex].totalFase - totalPagado;
          resumenFases[paymentPhase.faseIndex].pagos = paymentPhase.pagos
            .map(pago => ({
              _id: pago._id,
              descripcion: pago.descripcion,
              fecha: pago.fecha,
              monto: pago.monto,
              saldo: pago.saldo,
              metodoPago: pago.metodoPago,
              anulado: pago.anulado
            }));
        }
      });
  
      const resumenGeneral = {
        totalPresupuesto: budget.totalGeneral,
        totalPagado: resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0),
        saldoPendiente: budget.totalGeneral - resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0),
        porcentajePagado: (resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0) / budget.totalGeneral) * 100,
        estadoPago: calcularEstadoPago(
          budget.totalGeneral, 
          resumenFases.reduce((sum, fase) => sum + fase.totalPagado, 0)
        )
      };

      function calcularEstadoPago(total, pagado) {
        if (pagado === 0) return 'pendiente';
        if (pagado >= total) return 'completado';
        return 'parcial';
      }
  
      res.json({
        resumenGeneral,
        fases: resumenFases
      });
    } catch (error) {
      console.error('Error al obtener resumen de pagos:', error);
      res.status(500).json({ error: 'Error al obtener el resumen de pagos' });
    }
  });

// Registrar nuevo pago
paymentsRouter.post('/budget/:budgetId/fase/:faseIndex/pago', async (req, res) => {
  try {
    const { descripcion, monto, metodoPago } = req.body;
    const { budgetId, faseIndex } = req.params;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    // Validar que el presupuesto esté aceptado
    if (budget.estado !== 'aceptado') {
      return res.status(400).json({ 
        error: 'Solo se pueden registrar pagos para presupuestos aceptados' 
      });
    }

    // Buscar o crear el registro de pagos para la fase
    
    let paymentPhase = await Payment.findOne({ 
      budget: budgetId,
      faseIndex: parseInt(faseIndex)
    });

    if (!paymentPhase) {
      paymentPhase = await Payment.initializeForBudgetPhase(budget, parseInt(faseIndex));
    }
    
/*
    let paymentPhase = await Payment.findOne({ 
        budget: budgetId,
        faseIndex: parseInt(faseIndex)
      });
      
      if (!paymentPhase) {
        paymentPhase = new Payment({
          budget: budgetId,
          faseIndex: parseInt(faseIndex),
          nombreFase: budget.fases[parseInt(faseIndex)].nombre,
          totalFase: budget.fases[parseInt(faseIndex)].total
        });
        await paymentPhase.save();
      }
*/

    // Validar que el monto no exceda el saldo pendiente
    if (monto > paymentPhase.saldoPendiente) {
      return res.status(400).json({ 
        error: 'El monto del pago excede el saldo pendiente' 
      });
    }

    // Registrar el pago
    paymentPhase.pagos.push({
      descripcion,
      monto,
      metodoPago,
      fecha: new Date(),
      saldo: paymentPhase.saldoPendiente - monto
    });

    const updatedPaymentPhase = await paymentPhase.save();

    // Crear registro financiero
    const financialReport = new FinancialReport({
        presupuesto: budgetId,
        paciente: budget.paciente._id,
        monto,
        metodoPago,
        conceptoPago: `Pago de fase ${parseInt(faseIndex) + 1}: ${descripcion}`
      });

    await financialReport.save();

    // Actualizar el estado del presupuesto
    const allPayments = await Payment.find({ budget: budgetId });
    const totalPagado = allPayments.reduce((sum, phase) => 
      sum + phase.pagos.filter(p => !p.anulado)
        .reduce((pSum, pago) => pSum + pago.monto, 0), 0);

    budget.totalPagado = totalPagado;
    budget.saldoPendienteTotal = budget.totalGeneral - totalPagado;
    budget.estadoPagoGeneral = totalPagado === 0 ? 'pendiente' :
                              totalPagado >= budget.totalGeneral ? 'completado' : 'parcial';
    await budget.save();

    res.json(updatedPaymentPhase);
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// Anular pago
paymentsRouter.patch('/budget/:budgetId/fase/:faseIndex/pago/:pagoId/anular', async (req, res) => {
  try {
    const { budgetId, faseIndex, pagoId } = req.params;
    const { motivo } = req.body;

    const paymentPhase = await Payment.findOne({
      budget: budgetId,
      faseIndex: parseInt(faseIndex)
    });

    if (!paymentPhase) {
      return res.status(404).json({ error: 'Fase de pago no encontrada' });
    }

    const pago = paymentPhase.pagos.id(pagoId);
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Anular el registro financiero
    await FinancialReport.findOneAndDelete({
        presupuesto: budgetId,
        monto: pago.monto,
        metodoPago: pago.metodoPago,
        fecha: pago.fecha
      });

    // Anular el pago
    pago.anulado = true;
    pago.fechaAnulacion = new Date();
    pago.motivoAnulacion = motivo;

    const updatedPaymentPhase = await paymentPhase.save();

    // Actualizar el presupuesto restando el pago anulado
    const budget = await Budget.findById(budgetId);
    await budget.actualizarPagosFase(parseInt(faseIndex), -pago.monto);

    res.json(updatedPaymentPhase);
  } catch (error) {
    console.error('Error al anular pago:', error);
    res.status(500).json({ error: 'Error al anular el pago' });
  }
});

module.exports = paymentsRouter;
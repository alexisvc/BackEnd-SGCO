// controllers/balances.js
const express = require('express')
const balancesRouter = express.Router()
const Budget = require('../models/Budget')
const TreatmentPlan = require('../models/TreatmentPlan')

// Obtener balance de todos los presupuestos de un paciente
balancesRouter.get('/paciente/:pacienteId', async (req, res) => {
  try {
    // Buscar todos los presupuestos del paciente
    const presupuestos = await Budget.find({ paciente: req.params.pacienteId })

    const balances = await Promise.all(presupuestos.map(async presupuesto => {
      // Obtener tratamientos del presupuesto
      const tratamientos = await TreatmentPlan.find({ presupuesto: presupuesto._id })

      // Calcular balance para cada procedimiento
      const procedimientosBalance = presupuesto.procedimientos.map(proc => {
        // Filtrar tratamientos del procedimiento
        const tratamientosProcedimiento = tratamientos.filter(
          t => t.procedimiento.toString() === proc._id.toString()
        )

        // Calcular balance para cada fase
        const fasesBalance = proc.fases.map(fase => {
          const tratamientosFase = tratamientosProcedimiento.filter(
            t => t.fase.toString() === fase._id.toString()
          )

          const abonadoFase = tratamientosFase.reduce(
            (total, t) => total + t.montoAbono,
            0
          )

          return {
            nombreFase: fase.nombreFase,
            totalFase: fase.totalFase,
            abonadoFase,
            saldoFase: fase.totalFase - abonadoFase,
            tratamientos: tratamientosFase.map(t => ({
              fecha: t.fechaPlanTrat,
              monto: t.montoAbono,
              actividad: t.actividadPlanTrat
            }))
          }
        })

        // Calcular totales del procedimiento
        const abonadoProcedimiento = fasesBalance.reduce(
          (total, fase) => total + fase.abonadoFase,
          0
        )

        return {
          nombreProcedimiento: proc.nombreProcedimiento,
          totalProcedimiento: proc.totalProcedimiento,
          abonadoProcedimiento,
          saldoProcedimiento: proc.totalProcedimiento - abonadoProcedimiento,
          fases: fasesBalance
        }
      })

      // Calcular totales del presupuesto
      const totalAbonado = procedimientosBalance.reduce(
        (total, proc) => total + proc.abonadoProcedimiento,
        0
      )

      return {
        id: presupuesto._id,
        totalPresupuesto: presupuesto.totalPresupuesto,
        totalAbonado,
        saldoPendiente: presupuesto.totalPresupuesto - totalAbonado,
        procedimientos: procedimientosBalance
      }
    }))

    res.json(balances)
  } catch (error) {
    console.error('Error al obtener balances del paciente:', error)
    res.status(500).json({ error: 'Error al obtener balances del paciente' })
  }
})

// Obtener balance de un presupuesto específico
balancesRouter.get('/presupuesto/:presupuestoId', async (req, res) => {
  try {
    const presupuesto = await Budget.findById(req.params.presupuestoId)
    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    // Obtener tratamientos del presupuesto
    const tratamientos = await TreatmentPlan.find({ presupuesto: presupuesto._id })

    // Calcular balance para cada procedimiento
    const procedimientosBalance = presupuesto.procedimientos.map(proc => {
      // Filtrar tratamientos del procedimiento
      const tratamientosProcedimiento = tratamientos.filter(
        t => t.procedimiento.toString() === proc._id.toString()
      )

      // Calcular balance para cada fase
      const fasesBalance = proc.fases.map(fase => {
        const tratamientosFase = tratamientosProcedimiento.filter(
          t => t.fase.toString() === fase._id.toString()
        )

        const abonadoFase = tratamientosFase.reduce(
          (total, t) => total + t.montoAbono,
          0
        )

        return {
          nombreFase: fase.nombreFase,
          totalFase: fase.totalFase,
          abonadoFase,
          saldoFase: fase.totalFase - abonadoFase,
          tratamientos: tratamientosFase.map(t => ({
            fecha: t.fechaPlanTrat,
            monto: t.montoAbono,
            actividad: t.actividadPlanTrat
          }))
        }
      })

      // Calcular totales del procedimiento
      const abonadoProcedimiento = fasesBalance.reduce(
        (total, fase) => total + fase.abonadoFase,
        0
      )

      return {
        nombreProcedimiento: proc.nombreProcedimiento,
        totalProcedimiento: proc.totalProcedimiento,
        abonadoProcedimiento,
        saldoProcedimiento: proc.totalProcedimiento - abonadoProcedimiento,
        fases: fasesBalance
      }
    })

    // Calcular totales del presupuesto
    const totalAbonado = procedimientosBalance.reduce(
      (total, proc) => total + proc.abonadoProcedimiento,
      0
    )

    const balance = {
      totalPresupuesto: presupuesto.totalPresupuesto,
      totalAbonado,
      saldoPendiente: presupuesto.totalPresupuesto - totalAbonado,
      procedimientos: procedimientosBalance
    }

    res.json(balance)
  } catch (error) {
    console.error('Error al obtener balance:', error)
    res.status(500).json({ error: 'Error al obtener el balance' })
  }
})

// Obtener balance de un procedimiento específico
balancesRouter.get('/presupuesto/:presupuestoId/procedimiento/:procedimientoId', async (req, res) => {
  try {
    const presupuesto = await Budget.findById(req.params.presupuestoId)
    if (!presupuesto) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' })
    }

    const procedimiento = presupuesto.procedimientos.id(req.params.procedimientoId)
    if (!procedimiento) {
      return res.status(404).json({ error: 'Procedimiento no encontrado' })
    }

    // Obtener tratamientos del procedimiento
    const tratamientos = await TreatmentPlan.find({
      presupuesto: req.params.presupuestoId,
      procedimiento: req.params.procedimientoId
    })

    // Calcular balance para cada fase
    const fasesBalance = procedimiento.fases.map(fase => {
      const tratamientosFase = tratamientos.filter(
        t => t.fase.toString() === fase._id.toString()
      )

      const abonadoFase = tratamientosFase.reduce(
        (total, t) => total + t.montoAbono,
        0
      )

      return {
        nombreFase: fase.nombreFase,
        totalFase: fase.totalFase,
        abonadoFase,
        saldoFase: fase.totalFase - abonadoFase,
        tratamientos: tratamientosFase.map(t => ({
          fecha: t.fechaPlanTrat,
          monto: t.montoAbono,
          actividad: t.actividadPlanTrat
        }))
      }
    })

    // Calcular totales del procedimiento
    const abonadoProcedimiento = fasesBalance.reduce(
      (total, fase) => total + fase.abonadoFase,
      0
    )

    const balance = {
      nombreProcedimiento: procedimiento.nombreProcedimiento,
      totalProcedimiento: procedimiento.totalProcedimiento,
      abonadoProcedimiento,
      saldoProcedimiento: procedimiento.totalProcedimiento - abonadoProcedimiento,
      fases: fasesBalance
    }

    res.json(balance)
  } catch (error) {
    console.error('Error al obtener balance del procedimiento:', error)
    res.status(500).json({ error: 'Error al obtener el balance del procedimiento' })
  }
})

module.exports = balancesRouter
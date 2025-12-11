const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/agendamentos', agendamentoController.list);
router.post('/agendamentos', agendamentoController.create);
router.delete('/agendamentos/:id', agendamentoController.delete);
router.put('/agendamentos/:id', agendamentoController.update);
router.put('/agendamentos/:id/reservar', agendamentoController.reservar);

// Disponibilidade
router.post('/disponibilidade', agendamentoController.createDisponibilidade);
router.delete('/disponibilidade/:id', agendamentoController.deleteDisponibilidade);

module.exports = router;

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/barbearia/:slug', publicController.getBarbeariaBySlug);
router.post('/agendamentos', publicController.createAgendamento);
router.get('/disponibilidade/:barbeariaId', publicController.getDisponibilidade);
router.put('/agendamentos/:id/reservar', publicController.reservarAgendamento);

module.exports = router;

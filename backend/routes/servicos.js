const express = require('express');
const router = express.Router();
const servicoController = require('../controllers/servicoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/servicos', servicoController.list);
router.post('/servicos', servicoController.create);
router.delete('/servicos/:id', servicoController.delete);
router.put('/servicos/:id', servicoController.update);

module.exports = router;

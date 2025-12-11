const express = require('express');
const router = express.Router();
const barbeariaController = require('../controllers/barbeariaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/barbearias', barbeariaController.list);
router.patch('/barbearias/:id', barbeariaController.update);

module.exports = router;

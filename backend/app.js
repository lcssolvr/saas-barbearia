const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('api rodando'));

// ROUTES
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/users');
const agendamentoRoutes = require('./routes/agendamentos');
const servicoRoutes = require('./routes/servicos');
const barbeariaRoutes = require('./routes/barbearias');

app.use('/api', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', userRoutes);
app.use('/api', agendamentoRoutes);
app.use('/api', servicoRoutes);
app.use('/api', barbeariaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend rodando na porta ${PORT}`));
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middlewares/authMiddleware');
const supabase = require('./config/supabase');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('API BarberSaaS Rodando 🚀'));

app.use('/api', authMiddleware);

app.get('/api/agendamentos', async (req, res) => {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('barbearia_id', req.barbeariaId);

    if (error) return res.status(400).json(error);
    res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
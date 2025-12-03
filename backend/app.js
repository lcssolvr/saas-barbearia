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

// INICIO AGENDAMENTOS

app.get('/api/agendamentos', async (req, res) => {
    const { data, error } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome, preco)')
        .eq('barbearia_id', req.barbeariaId);

    if (error) return res.status(400).json(error);
    res.json(data);
});

app.post('/api/agendamentos', async (req, res) => {
    try {
        const { cliente_nome, data_hora, servico_id } = req.body;

        if (!cliente_nome || !data_hora || !servico_id) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('agendamentos')
            .insert([
                {
                    barbearia_id: req.barbeariaId, 
                    barbeiro_id: req.user.id,
                    cliente_nome,
                    data_hora,
                    servico_id,
                    status: 'pendente'
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Erro ao criar agendamento' });
    }
});

// FIM AGENDAMENTOS

// INICIO SERVICOS

app.get('/api/servicos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .eq('barbearia_id', req.barbeariaId);
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao buscar serviços' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
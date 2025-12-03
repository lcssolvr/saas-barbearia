const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middlewares/authMiddleware');
const supabase = require('./config/supabase');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('API BarberSaaS Rodando 🚀'));

// SIGN UP

app.post('/api/cadastro', async (req, res) => {
    try {
        const { nome_dono, email, password, nome_barbearia } = req.body;

        if (!email || !password || !nome_barbearia) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (authError) throw authError;

        const novoUserId = authData.user.id;

        const { data: barbeariaData, error: barbeariaError } = await supabase
            .from('barbearias')
            .insert([{
                nome: nome_barbearia,
                plano: 'free',
                status: 'ativo'
            }])
            .select()
            .single();

        if (barbeariaError) {
            await supabase.auth.admin.deleteUser(novoUserId);
            throw barbeariaError;
        }

        const { error: profileError } = await supabase
            .from('usuarios')
            .insert([{
                id: novoUserId,
                barbearia_id: barbeariaData.id,
                nome: nome_dono,
                email: email,
                tipo: 'dono'
            }]);

        if (profileError) throw profileError;
        
        await supabase.from('servicos').insert([
            { barbearia_id: barbeariaData.id, nome: 'Corte Simples', preco: 30, duracao_minutos: 30 },
            { barbearia_id: barbeariaData.id, nome: 'Barba', preco: 20, duracao_minutos: 20 }
        ]);

        res.status(201).json({ message: 'Conta criada com sucesso!', user: authData.user });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Erro ao criar conta' });
    }
});

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

app.delete('/api/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id)
            .eq('barbearia_id', req.barbeariaId);

        if (error) throw error;

        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Erro ao cancelar agendamento' });
    }
});

app.put('/api/agendamentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_nome, data_hora, servico_id, status } = req.body;

        const { data, error } = await supabase
            .from('agendamentos')
            .update({ 
                cliente_nome, 
                data_hora, 
                servico_id, 
                status 
            })
            .eq('id', id)
            .eq('barbearia_id', req.barbeariaId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao atualizar agendamento' });
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

app.post('/api/servicos', async (req, res) => {
    try {
        const { nome, preco, duracao_minutos } = req.body;
        
        const { data, error } = await supabase
            .from('servicos')
            .insert([{
                barbearia_id: req.barbeariaId,
                nome,
                preco,
                duracao_minutos: duracao_minutos || 30
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao criar serviço' });
    }
});

app.delete('/api/servicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('servicos')
            .delete()
            .eq('id', id)
            .eq('barbearia_id', req.barbeariaId);

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Erro ao deletar serviço' });
    }
});

app.put('/api/servicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, preco, duracao_minutos } = req.body;

        const { data, error } = await supabase
            .from('servicos')
            .update({ nome, preco, duracao_minutos })
            .eq('id', id)
            .eq('barbearia_id', req.barbeariaId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao atualizar serviço' });
    }
});

// FIM SERVICOS



const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend rodando na porta ${PORT}`));
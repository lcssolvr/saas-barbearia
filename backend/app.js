const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middlewares/authMiddleware');
const supabase = require('./config/supabase');

function criarSlug(nome) {
    if (!nome) return '';
    return nome
        .toString()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('api rodando'));

// SIGN UP

app.post('/api/cadastro', async (req, res) => {
    try {
        const { nome, email, password, tipo, nome_barbearia, slug_barbearia } = req.body;

        if (!['dono', 'barbeiro', 'cliente'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de perfil inválido.' });
        }

        let barbeariaId = null;
        let slugFinal = null;

        // VALIDAÇÕES ESPECIFICAS
        if (tipo === 'dono') {
            if (!nome_barbearia) return res.status(400).json({ error: 'Nome da barbearia é obrigatório para donos.' });
        } else if (tipo === 'barbeiro') {
            if (!slug_barbearia) return res.status(400).json({ error: 'Slug da barbearia é obrigatório para barbeiros.' });

            const { data: bData, error: bError } = await supabase
                .from('barbearias')
                .select('id')
                .eq('slug', slug_barbearia)
                .single();

            if (bError || !bData) return res.status(404).json({ error: 'Barbearia não encontrada com este slug.' });
            barbeariaId = bData.id;
        }

        // CRIAR USUARIO AUTH
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true, user_metadata: { nome, tipo }
        });
        if (authError) throw authError;

        // SE FOR DONO, CRIA BARBEARIA
        if (tipo === 'dono') {
            const slugBase = criarSlug(nome_barbearia);
            const codigoUnico = authData.user.id.substring(0, 4);
            slugFinal = `${slugBase}-${codigoUnico}`;

            const { data: barbeariaData, error: barbeariaError } = await supabase
                .from('barbearias')
                .insert([{
                    nome: nome_barbearia,
                    slug: slugFinal,
                    plano: 'free',
                    status: 'ativo'
                }])
                .select()
                .single();

            if (barbeariaError) {
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw barbeariaError;
            }
            barbeariaId = barbeariaData.id;

            // Criar serviços padrão
            await supabase.from('servicos').insert([
                { barbearia_id: barbeariaId, nome: 'Corte', preco: 30, duracao_minutos: 30 },
                { barbearia_id: barbeariaId, nome: 'Barba', preco: 25, duracao_minutos: 30 }
            ]);
        }

        // INSERIR NA TABLE USUARIOS
        await supabase.from('usuarios').insert([{
            id: authData.user.id,
            barbearia_id: barbeariaId, // pode ser null se for cliente
            nome: nome,
            email: email,
            tipo: tipo
        }]);

        res.status(201).json({ message: 'Conta criada!', slug: slugFinal });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// ROTA PUBLICA AGENDAMENTO

app.get('/api/public/barbearia/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('barbearias')
            .select(`
                id, nome, slug,
                servicos ( id, nome, preco )
            `)
            .eq('slug', slug)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Barbearia não encontrada' });

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/public/agendamentos', async (req, res) => {
    try {
        const { barbearia_id, cliente_nome, data_hora, servico_id } = req.body;

        if (!cliente_nome || !data_hora || !servico_id) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }

        const { data: staff } = await supabase
            .from('usuarios')
            .select('id')
            .eq('barbearia_id', barbearia_id)
            .in('tipo', ['dono', 'barbeiro'])
            .limit(1)
            .single();

        if (!staff) return res.status(400).json({ error: 'Nenhum barbeiro disponível nesta unidade.' });

        const { error } = await supabase
            .from('agendamentos')
            .insert([{
                barbearia_id,
                barbeiro_id: staff.id,
                cliente_nome,
                servico_id,
                data_hora,
                status: 'pendente'
            }]);

        if (error) throw error;
        res.status(201).json({ message: 'Agendado com sucesso!' });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Erro ao agendar.' });
    }
});
// FIM ROTA PUBLICA AGENDAMENTO

app.use('/api', (req, res, next) => {
    if (req.path.includes('/public/') || req.path.includes('/register')) {
        return next();
    }
    authMiddleware(req, res, next);
});

// SUPER ADMIN ROUTES

const requireSuperAdmin = (req, res, next) => {
    console.log("Verificando acesso Admin para:", req.userType);
    if (req.userType !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas Super Admins.' });
    }
    next();
};

// ROTAS ADMIN

app.get('/api/admin/tenants', requireSuperAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('barbearias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/api/admin/tenants/:id', requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, plano } = req.body;

        const { data, error } = await supabase
            .from('barbearias')
            .update({ status, plano })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// FIM ROTAS ADMIN

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
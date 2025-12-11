const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authMiddleware = require('./middlewares/authMiddleware');
const { adminSupabase } = require('./config/supabase');
const { sendConfirmationEmail } = require('./services/emailService');

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
        const origin = req.get('origin') || 'http://localhost:5173';

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

            const { data: bData, error: bError } = await adminSupabase
                .from('barbearias')
                .select('id')
                .eq('slug', slug_barbearia)
                .single();

            if (bError || !bData) return res.status(404).json({ error: 'Barbearia não encontrada com este slug.' });
            barbeariaId = bData.id;
        }

        let authUser = null;
        let createdByBackend = false;

        try {
            const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
                email, password, email_confirm: false, user_metadata: { nome, tipo }
            });
            if (authError) throw authError;
            authUser = authData.user;
            createdByBackend = true;
        } catch (createError) {
            if (createError.message?.includes('already registered') || createError.status === 422) {
                const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
                if (listError) throw listError;

                const found = users.find(u => u.email === email);
                if (!found) throw new Error('User exists but could not be found via listUsers');
                authUser = found;
            } else {
                throw createError;
            }
        }

        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                redirectTo: `${origin}/auth/callback`,
                data: { nome, tipo }
            }
        });

        if (linkError) {
            console.error("Erro gerando link:", linkError);
            throw linkError;
        }

        await sendConfirmationEmail(email, linkData.properties.action_link);


        // SE FOR DONO, CRIA BARBEARIA
        if (tipo === 'dono') {
            const slugBase = criarSlug(nome_barbearia);
            const codigoUnico = authUser.id.substring(0, 4);

            slugFinal = `${slugBase}-${codigoUnico}`;

            const { data: barbeariaData, error: barbeariaError } = await adminSupabase
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
                if (createdByBackend) await adminSupabase.auth.admin.deleteUser(authUser.id);
                throw barbeariaError;
            }
            barbeariaId = barbeariaData.id;

            // Criar serviços padrão
            await adminSupabase.from('servicos').insert([
                { barbearia_id: barbeariaId, nome: 'Corte', preco: 30, duracao_minutos: 30 },
                { barbearia_id: barbeariaId, nome: 'Barba', preco: 25, duracao_minutos: 30 }
            ]);
        }

        // INSERIR NA TABLE USUARIOS
        await adminSupabase.from('usuarios').insert([{
            id: authUser.id,
            barbearia_id: barbeariaId, // pode ser null se for cliente
            nome: nome,
            email: email,
            tipo: tipo
        }]);

        res.status(201).json({ message: 'Conta criada! Verifique seu e-mail.', slug: slugFinal });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
});

// ROTA PUBLICA AGENDAMENTO

app.get('/api/public/barbearia/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data, error } = await adminSupabase
            .from('barbearias')
            .select(`
                id, nome, slug,
                servicos ( id, nome, preco, duracao_minutos )
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

        const { data: staff } = await adminSupabase
            .from('usuarios')
            .select('id')
            .eq('barbearia_id', barbearia_id)
            .in('tipo', ['dono', 'barbeiro'])
            .limit(1)
            .single();

        if (!staff) return res.status(400).json({ error: 'Nenhum barbeiro disponível nesta unidade.' });

        const { error } = await adminSupabase
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

// PUBLIC RESERVA

app.get('/api/public/disponibilidade/:barbeariaId', async (req, res) => {
    try {
        const { barbeariaId } = req.params;
        const { data } = req.query;

        let query = adminSupabase
            .from('agendamentos')
            .select(`
                id, data_hora, barbeiro_id,
                usuarios!barbeiro_id ( nome )
            `)
            .eq('barbearia_id', barbeariaId)
            .eq('status', 'disponivel')
            .gt('data_hora', new Date().toISOString());

        const { data: slots, error } = await query;
        if (error) throw error;

        res.json(slots);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao buscar horários' });
    }
});

app.put('/api/public/agendamentos/:id/reservar', async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_nome, servico_id } = req.body;

        const { data: slot, error: checkError } = await adminSupabase
            .from('agendamentos')
            .select('data_hora, status, barbeiro_id, barbearia_id')
            .eq('id', id)
            .single();

        if (checkError || !slot) return res.status(404).json({ error: 'Horário não encontrado' });
        if (slot.status !== 'disponivel') return res.status(409).json({ error: 'Horário já reservado' });

        const { data: servico, error: servicoError } = await adminSupabase
            .from('servicos')
            .select('duracao_minutos')
            .eq('id', servico_id)
            .single();

        if (servicoError || !servico) return res.status(400).json({ error: 'Serviço inválido' });

        const duracao = servico.duracao_minutos || 30;

        const dataInicio = new Date(slot.data_hora);
        const dataFim = new Date(dataInicio.getTime() + duracao * 60000);

        const { data, error } = await adminSupabase
            .from('agendamentos')
            .update({
                cliente_nome,
                servico_id,
                status: 'pendente'
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        const inicioConflito = new Date(dataInicio.getTime() + 1000).toISOString(); // +1s para não pegar o próprio slot (embora ele já esteja 'pendente' agora, mas por segurança)
        const fimConflito = dataFim.toISOString();

        await adminSupabase
            .from('agendamentos')
            .delete()
            .eq('barbearia_id', slot.barbearia_id)
            .eq('barbeiro_id', slot.barbeiro_id)
            .eq('status', 'disponivel')
            .gte('data_hora', inicioConflito)
            .lt('data_hora', fimConflito);

        res.json(data[0]);
    } catch (err) {
        console.error("Erro ao reservar:", err);
        res.status(400).json({ error: 'Erro ao reservar' });
    }
});

// FIM PUBLIC RESERVA

app.use('/api', (req, res, next) => {
    if (req.path.includes('/public/') || req.path.includes('/register')) {
        return next();
    }
    authMiddleware(req, res, next);
});

// ROTAS BARBEARIAS (RLS Protected)

app.get('/api/barbearias', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('barbearias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/api/barbearias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, plano } = req.body;

        const { data, error } = await req.supabase
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

// FIM ROTAS BARBEARIAS


// ROTA PERFIL
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('usuarios')
            .select(`
                id, nome, email, tipo, barbearia_id,
                barbearias ( slug, nome )
            `)
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            ...data,
            barbearia_slug: data.barbearias?.slug,
            barbearia_nome: data.barbearias?.nome
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// INICIO AGENDAMENTOS

app.get('/api/agendamentos', async (req, res) => {
    let query = req.supabase
        .from('agendamentos')
        .select('*, servicos(nome, preco, duracao_minutos), usuarios!barbeiro_id(nome)')
        .eq('barbearia_id', req.barbeariaId);

    if (req.userType === 'cliente') {

    }

    const { data, error } = await query;

    if (error) return res.status(400).json(error);
    res.json(data);
});

app.post('/api/agendamentos', async (req, res) => {
    try {
        const { cliente_nome, data_hora, servico_id } = req.body;

        if (!cliente_nome || !data_hora || !servico_id) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const { data, error } = await req.supabase
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

        const { error } = await req.supabase
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
        const { cliente_nome, data_hora, servico_id, status, barbeiro_id } = req.body;

        const { data, error } = await req.supabase
            .from('agendamentos')
            .update({
                cliente_nome,
                data_hora,
                servico_id,
                status,
                ...(barbeiro_id && { barbeiro_id })
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

// INICIO DISPONIBILIDADE

app.post('/api/disponibilidade', async (req, res) => {
    try {
        const { data_hora } = req.body;
        if (!data_hora) return res.status(400).json({ error: 'Data e hora são obrigatórios' });

        if (new Date(data_hora) < new Date()) {
            return res.status(400).json({ error: 'Não é possível disponibilizar horários no passado.' });
        }

        const { data, error } = await req.supabase
            .from('agendamentos')
            .insert([{
                barbearia_id: req.barbeariaId,
                barbeiro_id: req.user.id,
                cliente_nome: 'Livre',
                data_hora: data_hora,
                status: 'disponivel',
                servico_id: null
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Erro criar disponibilidade:", err);
        res.status(400).json({ error: 'Erro ao criar horário', details: err.message, pgError: err });
    }
});

app.delete('/api/disponibilidade/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await req.supabase
            .from('agendamentos')
            .delete()
            .eq('id', id)
            .eq('barbeiro_id', req.user.id)
            .eq('status', 'disponivel');

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'Erro ao remover horário' });
    }
});

// FIM DISPONIBILIDADE


// INICIO SERVICOS

app.get('/api/servicos', async (req, res) => {
    try {
        const { data, error } = await req.supabase
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

        const { data, error } = await req.supabase
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

        const { error } = await req.supabase
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

        const { data, error } = await req.supabase
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
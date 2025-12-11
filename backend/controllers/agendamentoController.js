const { adminSupabase } = require('../config/supabase');

exports.list = async (req, res) => {
    let query = req.supabase
        .from('agendamentos')
        .select('*, servicos(nome, preco, duracao_minutos), usuarios!barbeiro_id(nome), barbearias(slug, nome)')
        .eq('barbearia_id', req.barbeariaId);

    if (req.userType === 'cliente') {
        const userId = req.user.id;
        const userName = req.user.nome;
        if (userName) {
            query = query.or(`cliente_id.eq.${userId},cliente_nome.eq.${userName}`);
        } else {
            query = query.eq('cliente_id', userId);
        }
    }

    const { data, error } = await query;

    if (error) return res.status(400).json(error);
    res.json(data);
};

exports.create = async (req, res) => {
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
};

exports.delete = async (req, res) => {
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
};

exports.update = async (req, res) => {
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
};

exports.reservar = async (req, res) => {
    try {
        const { id } = req.params;
        const { servico_id } = req.body;
        const { data: slot, error: checkError } = await adminSupabase
            .from('agendamentos')
            .select('status, barbearia_id, barbeiro_id')
            .eq('id', id)
            .single();

        if (checkError || !slot) return res.status(404).json({ error: 'Horário não encontrado' });
        if (slot.status !== 'disponivel') return res.status(409).json({ error: 'Horário já reservado' });

        const { data, error } = await adminSupabase
            .from('agendamentos')
            .update({
                cliente_nome: req.user.nome,
                servico_id,
                status: 'pendente',
                cliente_id: req.user.id
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json(data[0]);

    } catch (err) {
        console.error("Erro ao reservar (autenticado):", err);
        res.status(400).json({ error: 'Erro ao reservar horário.' });
    }
};

// DISPONIBILIDADE
exports.createDisponibilidade = async (req, res) => {
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
        res.status(400).json({ error: 'Erro ao criar horário', details: err.message });
    }
};

exports.deleteDisponibilidade = async (req, res) => {
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
};

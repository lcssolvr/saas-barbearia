const { adminSupabase } = require('../config/supabase');

exports.getBarbeariaBySlug = async (req, res) => {
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
};

exports.createAgendamento = async (req, res) => {
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
};

exports.getDisponibilidade = async (req, res) => {
    try {
        const { barbeariaId } = req.params;

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
};

exports.reservarAgendamento = async (req, res) => {
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

        const inicioConflito = new Date(dataInicio.getTime() + 1000).toISOString();
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
};

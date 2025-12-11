exports.list = async (req, res) => {
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
};

exports.create = async (req, res) => {
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
};

exports.delete = async (req, res) => {
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
};

exports.update = async (req, res) => {
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
};

exports.getMe = async (req, res) => {
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
};

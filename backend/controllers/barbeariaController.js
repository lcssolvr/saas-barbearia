exports.list = async (req, res) => {
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
};

exports.update = async (req, res) => {
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
};

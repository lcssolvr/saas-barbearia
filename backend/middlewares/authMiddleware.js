const { createScopedClient } = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: 'Token ausente' });
    const token = authHeader.split(' ')[1];

    try {
        const supabase = createScopedClient(token);

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Token inválido');

        const { data: profile, error: profileError } = await supabase
            .from('usuarios')
            .select(`
                barbearia_id, 
                tipo,
                barbearias ( status )
            `)
            .eq('id', user.id)
            .single();

        if (profileError || !profile) return res.status(403).json({ error: 'Perfil não encontrado.' });
        let rawStatus = 'ativo';

        if (profile.barbearias) {
            if (Array.isArray(profile.barbearias)) {
                if (profile.barbearias.length > 0) rawStatus = profile.barbearias[0].status;
            } else {
                rawStatus = profile.barbearias.status;
            }
        }
        const statusLimpo = String(rawStatus || '').toLowerCase().trim();
        if (statusLimpo === 'bloqueado') {
            if (profile.tipo === 'super_admin') {
                console.log("Barbearia bloqueada, mas Super Admin tem imunidade.");
            }
            else {
                return res.status(403).json({
                    error: 'Acesso Suspenso. Sua barbearia foi bloqueada.'
                });
            }
        }

        req.supabase = supabase;
        req.user = user;
        req.barbeariaId = profile.barbearia_id;
        req.userType = profile.tipo;

        next();

    } catch (err) {
        console.error("Erro Auth:", err.message);
        return res.status(401).json({ error: 'Não autorizado' });
    }
};

module.exports = authMiddleware;
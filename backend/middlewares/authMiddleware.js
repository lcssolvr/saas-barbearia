const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token ausente' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            throw new Error('Token inválido');
        }

        const { data: profile, error: profileError } = await supabase
            .from('usuarios')
            .select('barbearia_id, tipo') 
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {;
            return res.status(403).json({ error: 'Perfil de usuário não encontrado no sistema.' });
        }


        req.user = user;
        req.barbeariaId = profile.barbearia_id;
        req.userType = profile.tipo;
        
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
};

module.exports = authMiddleware;
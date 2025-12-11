const { adminSupabase } = require('../config/supabase');
const { criarSlug } = require('../utils/slug');

exports.register = async (req, res) => {
    try {
        const { nome, email, password, tipo, nome_barbearia, slug_barbearia } = req.body;
        // const origin = req.get('origin') || 'http://localhost:5173'; // Não usado mais pois removemos email

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
                email, password, email_confirm: true, user_metadata: { nome, tipo }
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

        res.status(201).json({ message: 'Conta criada com sucesso!', slug: slugFinal });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
};

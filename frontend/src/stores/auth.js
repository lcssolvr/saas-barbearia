import { defineStore } from 'pinia';
import { supabase } from '../services/supabase';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    userType: null,
  }),
  actions: {
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('tipo')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error("Erro ao buscar perfil:", profileError);
        throw new Error("Usuário sem perfil na tabela de dados.");
      }

      this.user = data.user;
      this.session = data.session;
      this.userType = profile.tipo; 

      localStorage.setItem('barber_token', data.session.access_token);
      localStorage.setItem('user_type', profile.tipo);
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.session = null;
      this.userType = null;
      localStorage.removeItem('barber_token');
      localStorage.removeItem('user_type');
    },

    async checkSession() {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            this.user = data.session.user;
            this.session = data.session;
            this.userType = localStorage.getItem('user_type');
        }
    }
  }
});
import { defineStore } from 'pinia';
import { supabase } from '../services/supabase';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
  }),
  actions: {
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      this.user = data.user;
      this.session = data.session;
      localStorage.setItem('barber_token', data.session.access_token);
    },
    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.session = null;
      localStorage.removeItem('barber_token');
    }
  }
});
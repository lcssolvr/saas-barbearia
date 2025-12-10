<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../services/supabase';

const router = useRouter();

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      localStorage.setItem('barber_token', session.access_token);
      localStorage.setItem('user_type', session.user.user_metadata.tipo || 'cliente');
      
      router.push('/dashboard');
    }
  });
});
</script>

<template>
  <div class="callback-container">
    <div class="spinner"></div>
    <p>Autenticando...</p>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8fafc;
  font-family: 'Segoe UI', sans-serif;
}
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

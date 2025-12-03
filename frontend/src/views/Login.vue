<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('admin@barbearia.com'); // Já deixei preenchido pra facilitar seu teste
const password = ref('123456');
const router = useRouter();
const authStore = useAuthStore();
const erro = ref('');

const handleLogin = async () => {
  try {
    erro.value = '';
    // Chama a action do Pinia que criamos antes
    await authStore.login(email.value, password.value);
    
    // Se der certo, redireciona para o Dashboard
    router.push('/dashboard');
  } catch (err) {
    erro.value = 'Login falhou. Verifique os dados.';
    console.error(err);
  }
};
</script>

<template>
  <div class="login-container">
    <h1>💇‍♂️ BarberSaaS</h1>
    <div class="card">
      <h2>Entrar</h2>
      <input v-model="email" type="email" placeholder="Seu e-mail" />
      <input v-model="password" type="password" placeholder="Sua senha" />
      
      <button @click="handleLogin">Acessar Sistema</button>
      
      <p v-if="erro" class="error">{{ erro }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-container { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    height: 100vh; 
    background: #f4f4f4; 
}

.card { background: white; 
    padding: 2rem; 
    border-radius: 8px; 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
    width: 300px;
}

button { 
    background: #2c3e50; 
    color: white; 
    border: none; 
    padding: 10px; 
    cursor: pointer; 
    border-radius: 4px;
}

button:hover { 
    background: #34495e; 
}

.error { 
    color: red; 
    font-size: 0.9rem; 
}

</style>
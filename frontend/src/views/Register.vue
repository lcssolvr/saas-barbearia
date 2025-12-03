<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const form = ref({
  nome_dono: '',
  email: '',
  password: '',
  nome_barbearia: ''
});

const loading = ref(false);
const erro = ref('');

const handleRegister = async () => {
  if (!form.value.nome_dono || !form.value.email || !form.value.password || !form.value.nome_barbearia) {
    erro.value = "Preencha todos os campos.";
    return;
  }

  loading.value = true;
  erro.value = '';

  try {
    await api.post('/cadastro', form.value);
    
    alert("Conta criada com sucesso! Faça login para continuar.");
    router.push('/');
  } catch (err) {
    console.error(err);
    erro.value = err.response?.data?.error || "Erro ao criar conta. Tente novamente.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <div class="header">
        <h1>Crie sua conta</h1>
        <p>Comece a gerenciar sua barbearia hoje</p>
      </div>

      <form @submit.prevent="handleRegister" class="form-body">
        
        <div class="input-group">
          <label>Seu Nome</label>
          <input v-model="form.nome_dono" type="text" placeholder="Ex: Lucas Silva" required />
        </div>

        <div class="input-group">
          <label>Nome da Barbearia</label>
          <input v-model="form.nome_barbearia" type="text" placeholder="Ex: Lucas Barber Shop" required />
        </div>

        <div class="input-group">
          <label>E-mail</label>
          <input v-model="form.email" type="email" placeholder="seu@email.com" required />
        </div>

        <div class="input-group">
          <label>Senha</label>
          <input v-model="form.password" type="password" placeholder="Mínimo 6 caracteres" required />
        </div>

        <div v-if="erro" class="error-box">⚠️ {{ erro }}</div>

        <button type="submit" :disabled="loading" class="btn-register">
          {{ loading ? 'Criando...' : 'Criar Conta Grátis' }}
        </button>

        <div class="login-link">
          Já tem conta? <a @click="router.push('/')">Fazer Login</a>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: 'Segoe UI', sans-serif; padding: 20px;
}
.register-card { background: white; width: 100%; max-width: 450px; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.header { text-align: center; margin-bottom: 25px; }
h1 { margin: 0; color: #1e293b; font-size: 1.8rem; }
p { color: #64748b; margin: 5px 0 0 0; }

.form-body { display: flex; flex-direction: column; gap: 15px; }
.input-group { display: flex; flex-direction: column; gap: 5px; }
.input-group label { font-size: 0.9rem; font-weight: 600; color: #334155; }
input { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
input:focus { border-color: #2563eb; outline: none; }

.btn-register { background: #10b981; color: white; border: none; padding: 14px; font-size: 1rem; font-weight: 600; cursor: pointer; border-radius: 8px; margin-top: 10px; }
.btn-register:hover:not(:disabled) { background: #059669; }
.btn-register:disabled { background: #94a3b8; }

.error-box { background: #fef2f2; color: #ef4444; padding: 10px; border-radius: 6px; text-align: center; font-size: 0.9rem;}

.login-link { text-align: center; margin-top: 15px; font-size: 0.9rem; color: #64748b; }
.login-link a { color: #2563eb; cursor: pointer; text-decoration: underline; font-weight: 600; }
</style>
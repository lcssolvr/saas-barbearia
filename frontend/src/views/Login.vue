<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const email = ref('');
const password = ref('');
const loading = ref(false);
const erro = ref('');

const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  if (!email.value || !password.value) {
    erro.value = 'Preencha todos os campos.';
    return;
  }

  try {
    erro.value = '';
    loading.value = true;
    await authStore.login(email.value, password.value);

    const tipo = String(authStore.userType).trim().toLowerCase();

    if (tipo === 'super_admin') {
        router.push('/dashboard');
    } else {
        router.push('/dashboard');
    }
    
  } catch (err) {
    console.error(err);
    // Exibe a mensagem real do erro (Supabase ou Store)
    erro.value = err.message || 'Erro ao realizar login.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      
      <div class="header">
        <div class="logo-circle">
          💈
        </div>
        <h1>NaRégua</h1>
        <p class="subtitle">Gestão inteligente para sua barbearia</p>
      </div>

      <form @submit.prevent="handleLogin" class="form-body">
        
        <div class="input-group">
          <label>E-mail</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="seu@email.com" 
            required
            :disabled="loading"
          />
        </div>

        <div class="input-group">
          <label>Senha</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Sua senha" 
            required
            :disabled="loading"
          />
        </div>
        
        <div v-if="erro" class="error-box">
          ⚠️ {{ erro }}
        </div>

        <button type="submit" :disabled="loading" class="btn-login">
          <span v-if="loading">Entrando...</span>
          <span v-else>Acessar Painel →</span>
        </button>

        <div class="register-link" style="text-align: center; margin-top: 15px; font-size: 0.9rem; color: #64748b;">
            Ainda não é cliente? <a @click="router.push('/cadastro')" style="color: #2563eb; cursor: pointer; font-weight: 600;">Criar conta grátis</a>
        </div>

      </form>
      
      <div class="footer">
        <small>© 2025 NaRégua System</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  min-height: 100vh; 
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  font-family: 'Segoe UI', sans-serif;
  padding: 20px;
}

.login-card { 
  background: white; 
  width: 100%;
  max-width: 400px;
  padding: 40px; 
  border-radius: 16px; 
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header { text-align: center; margin-bottom: 30px; }
.logo-circle {
  background: #eff6ff;
  color: #2563eb;
  font-size: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px auto;
}
h1 { margin: 0; color: #1e293b; font-size: 1.8rem; letter-spacing: -0.5px; }
.subtitle { color: #64748b; margin: 5px 0 0 0; font-size: 0.9rem; }

.form-body { display: flex; flex-direction: column; gap: 20px; }

.input-group { display: flex; flex-direction: column; gap: 8px; }
.input-group label { font-size: 0.9rem; font-weight: 600; color: #334155; }
.input-group input {
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
}
.input-group input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.input-group input:disabled { background: #f1f5f9; cursor: not-allowed; }

.btn-login { 
  background: #2563eb; 
  color: white; 
  border: none; 
  padding: 14px; 
  font-size: 1rem; 
  font-weight: 600;
  cursor: pointer; 
  border-radius: 8px;
  transition: background 0.2s;
  margin-top: 10px;
}
.btn-login:hover:not(:disabled) { background: #1d4ed8; }
.btn-login:disabled { background: #94a3b8; cursor: wait; }

.error-box { 
  background: #fef2f2; 
  color: #ef4444; 
  padding: 10px; 
  border-radius: 6px; 
  font-size: 0.9rem; 
  text-align: center;
  border: 1px solid #fee2e2;
}

.footer { text-align: center; margin-top: 30px; color: #94a3b8; }

@media (max-width: 480px) {
  .login-card {
    padding: 25px;
  }
}
</style>
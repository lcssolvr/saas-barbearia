<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const form = ref({
  nome: '',
  email: '',
  password: '',
  tipo: 'dono',
  nome_barbearia: '',
  slug_barbearia: ''
});

const loading = ref(false);
const erro = ref('');

const handleRegister = async () => {
  erro.value = '';
  
  if (!form.value.nome || !form.value.email || !form.value.password) {
    erro.value = "Preencha os campos básicos.";
    return;
  }

  if (form.value.tipo === 'dono' && !form.value.nome_barbearia) {
    erro.value = "Informe o nome da sua barbearia.";
    return;
  }
  
  if (form.value.tipo === 'barbeiro' && !form.value.slug_barbearia) {
    erro.value = "Informe o Slug da barbearia onde você trabalha.";
    return;
  }

  loading.value = true;

  try {
    const payload = {
        nome: form.value.nome,
        email: form.value.email,
        password: form.value.password,
        tipo: form.value.tipo,
        nome_barbearia: form.value.tipo === 'dono' ? form.value.nome_barbearia : undefined,
        slug_barbearia: form.value.tipo === 'barbeiro' ? form.value.slug_barbearia : undefined
    };

    await api.post('/cadastro', payload);
    
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
        <p>Escolha seu perfil abaixo</p>
      </div>

      <form @submit.prevent="handleRegister" class="form-body">
        
        <div class="input-group">
          <label>Eu sou:</label>
          <div class="profile-options">
             <label class="radio-card" :class="{ active: form.tipo === 'dono' }">
                <input type="radio" v-model="form.tipo" value="dono">
                <span>👑 Dono</span>
             </label>
             <label class="radio-card" :class="{ active: form.tipo === 'barbeiro' }">
                <input type="radio" v-model="form.tipo" value="barbeiro">
                <span>✂️ Barbeiro</span>
             </label>
             <label class="radio-card" :class="{ active: form.tipo === 'cliente' }">
                <input type="radio" v-model="form.tipo" value="cliente">
                <span>👤 Cliente</span>
             </label>
          </div>
        </div>

        <div class="input-group">
          <label>Seu Nome</label>
          <input v-model="form.nome" type="text" placeholder="Ex: Claudio Rocha" required />
        </div>

        <div v-if="form.tipo === 'dono'" class="input-group slide-in">
          <label>Nome da Barbearia</label>
          <input v-model="form.nome_barbearia" type="text" placeholder="Ex: Barber Shop" />
        </div>

        <div v-if="form.tipo === 'barbeiro'" class="input-group slide-in">
          <label>Código da Barbearia</label>
          <input v-model="form.slug_barbearia" type="text" placeholder="ex: barber-shop-1234" />
          <small style="color: #64748b; font-size: 0.8rem;">Peça este código ao dono da barbearia.</small>
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
          {{ loading ? 'Criando...' : 'Criar Conta' }}
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
input:not([type="radio"]) { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
input:focus { border-color: #2563eb; outline: none; }

.profile-options { display: flex; gap: 10px; }
.radio-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; cursor: pointer; text-align: center; font-size: 0.9rem; transition: 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;}
.radio-card input { display: none; }
.radio-card:hover { background: #f8fafc; }
.radio-card.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: bold; }

.slide-in { animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

.btn-register { background: #2563eb; color: white; border: none; padding: 14px; font-size: 1rem; font-weight: 600; cursor: pointer; border-radius: 8px; margin-top: 10px; }
.btn-register:hover:not(:disabled) { background: #0e2658; }
.btn-register:disabled { background: #94a3b8; }

.error-box { background: #fef2f2; color: #ef4444; padding: 10px; border-radius: 6px; text-align: center; font-size: 0.9rem;}

.login-link { text-align: center; margin-top: 15px; font-size: 0.9rem; color: #64748b; }
.login-link a { color: #2563eb; cursor: pointer; text-decoration: underline; font-weight: 600; text-decoration: none; }

@media (max-width: 480px) {
  .register-card {
    padding: 25px;
  }
}
</style>
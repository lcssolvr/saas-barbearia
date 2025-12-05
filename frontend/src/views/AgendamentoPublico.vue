<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const slug = route.params.slug;

let apiBase = import.meta.env.VITE_API_URL || 'https://saas-barbearia-t2gz.onrender.com/api';
if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
if (!apiBase.endsWith('/api')) apiBase += '/api';

const barbearia = ref(null);
const loading = ref(true);
const step = ref(1);

const form = ref({
  cliente_nome: '',
  data: '',
  hora: '',
  servico_id: '',
  servico_nome: '', 
  servico_preco: ''
});

onMounted(async () => {
  try {
    const res = await axios.get(`${apiBase}/public/barbearia/${slug}`);
    barbearia.value = res.data;
  } catch (error) {
    alert("Barbearia não encontrada.");
  } finally {
    loading.value = false;
  }
});

const selecionarServico = (servico) => {
  form.value.servico_id = servico.id;
  form.value.servico_nome = servico.nome;
  form.value.servico_preco = servico.preco;
  step.value = 2;
};

const confirmar = async () => {
  if (!form.value.cliente_nome || !form.value.data || !form.value.hora) {
    return alert("Por favor, preencha todos os dados.");
  }

  // INFORMAR AO BANCO HORÁRIO DE BRASILIA
  const dataHoraISO = `${form.value.data}T${form.value.hora}:00-03:00`;

  try {
    await axios.post(`${apiBase}/public/agendamentos`, {
      barbearia_id: barbearia.value.id,
      cliente_nome: form.value.cliente_nome,
      servico_id: form.value.servico_id,
      data_hora: dataHoraISO
    });
    step.value = 4;
  } catch (error) {
    alert("Erro ao agendar: " + (error.response?.data?.error || error.message));
  }
};

const voltar = () => { if(step.value > 1) step.value--; };
</script>

<template>
  <div class="public-page">
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando...</p>
    </div>

    <div v-else-if="barbearia" class="booking-card">
      
      <header class="card-header">
        <h1 class="brand-name">{{ barbearia.nome }}</h1>
        <div class="progress-bar">
          <div class="step" :class="{ active: step >= 1 }">1</div>
          <div class="line" :class="{ active: step >= 2 }"></div>
          <div class="step" :class="{ active: step >= 2 }">2</div>
          <div class="line" :class="{ active: step >= 3 }"></div>
          <div class="step" :class="{ active: step >= 3 }">3</div>
        </div>
      </header>

      <transition name="fade" mode="out-in">
        
        <div v-if="step === 1" key="step1" class="step-content">
          <h2>Escolha o serviço</h2>
          <p class="subtitle">O que vamos fazer hoje?</p>
          
          <div class="services-grid">
            <button 
              v-for="s in barbearia.servicos" 
              :key="s.id" 
              class="service-btn"
              @click="selecionarServico(s)"
            >
              <div class="service-info">
                <span class="service-name">{{ s.nome }}</span>
                <span class="service-duration">{{ s.duracao_minutos || 30 }} min</span>
              </div>
              <span class="service-price">R$ {{ s.preco }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="step === 2" key="step2" class="step-content">
          <h2>Escolha o horário</h2>
          <p class="subtitle">Quando você pode vir?</p>

          <div class="form-group">
            <label>Data</label>
            <input type="date" v-model="form.data" class="input-modern" />
          </div>

          <div class="form-group">
            <label>Horário</label>
            <input type="time" v-model="form.hora" class="input-modern" />
          </div>

          <div class="summary-box">
            <span>Serviço selecionado: <strong>{{ form.servico_nome }}</strong></span>
          </div>

          <div class="actions">
            <button @click="voltar" class="btn-secondary">Voltar</button>
            <button @click="step = 3" class="btn-primary" :disabled="!form.data || !form.hora">Continuar</button>
          </div>
        </div>

        <div v-else-if="step === 3" key="step3" class="step-content">
          <h2>Seus dados</h2>
          <p class="subtitle">Para confirmarmos o agendamento.</p>

          <div class="form-group">
            <label>Seu Nome</label>
            <input type="text" v-model="form.cliente_nome" placeholder="Ex: João da Silva" class="input-modern" />
          </div>

          <div class="final-summary">
            <div class="summary-row">
              <span>Serviço:</span> <strong>{{ form.servico_nome }}</strong>
            </div>
            <div class="summary-row">
              <span>Data:</span> <strong>{{ new Date(form.data + 'T00:00:00').toLocaleDateString('pt-BR') }}</strong>
            </div>
            <div class="summary-row">
              <span>Horário:</span> <strong>{{ form.hora }}</strong>
            </div>
            <div class="summary-total">
              <span>Total:</span> <strong>R$ {{ form.servico_preco }}</strong>
            </div>
          </div>

          <div class="actions">
            <button @click="voltar" class="btn-secondary">Voltar</button>
            <button @click="confirmar" class="btn-confirm">Confirmar Agendamento</button>
          </div>
        </div>

        <div v-else-if="step === 4" key="step4" class="success-screen">
          <div class="check-icon">✨</div>
          <h2>Agendado com Sucesso!</h2>
          <p>Tudo certo, <strong>{{ form.cliente_nome }}</strong>.</p>
          <p>Te esperamos dia {{ new Date(form.data + 'T00:00:00').toLocaleDateString('pt-BR') }} às {{ form.hora }}.</p>
          
          <button @click="step = 1; form.cliente_nome=''" class="btn-restart">Agendar outro</button>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.public-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.booking-card {
  background: white;
  width: 100%;
  max-width: 450px;
  min-height: 550px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  padding: 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-header { text-align: center; margin-bottom: 30px; }
.brand-name { margin: 0 0 20px 0; color: #1e293b; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; }

.progress-bar { display: flex; align-items: center; justify-content: center; gap: 5px; }
.step {  width: 30px; height: 30px; border-radius: 50%; background: #e2e8f0; color: #64748b;  display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; transition: 0.3s; }
.line { width: 40px; height: 3px; background: #e2e8f0; transition: 0.3s; }
.step.active { background: #2563eb; color: white; }
.line.active { background: #2563eb; }

h2 { margin: 0 0 5px 0; color: #1e293b; font-size: 1.3rem; }
.subtitle { color: #64748b; margin: 0 0 20px 0; font-size: 0.95rem; }

.services-grid { display: flex; flex-direction: column; gap: 12px; }
.service-btn { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: left; }
.service-btn:hover { border-color: #2563eb; background: #eff6ff; transform: translateY(-2px); }
.service-info { display: flex; flex-direction: column; }
.service-name { font-weight: 600; color: #334155; font-size: 1rem; }
.service-duration { font-size: 0.8rem; color: #94a3b8; }
.service-price { font-weight: 700; color: #2563eb; background: #dbeafe; padding: 4px 10px; border-radius: 20px; font-size: 0.9rem; }

.form-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-weight: 600; color: #475569; font-size: 0.9rem; }
.input-modern { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; transition: 0.2s; outline: none; background: #fff; box-sizing: border-box; }
.input-modern:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.actions { display: flex; gap: 12px; margin-top: auto; }
.btn-primary, .btn-confirm { flex: 1; padding: 14px; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.2s; color: white; }
.btn-primary { background: #2563eb; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

.btn-confirm { background: #10b981; }
.btn-confirm:hover { background: #059669; }

.btn-secondary { padding: 14px 20px; background: white; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s; }
.btn-secondary:hover { background: #f1f5f9; color: #1e293b; }

.summary-box { background: #eff6ff; padding: 12px; border-radius: 8px; color: #1e40af; font-size: 0.9rem; margin-bottom: 20px; text-align: center; border: 1px solid #dbeafe; }
.final-summary { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569; font-size: 0.95rem; }
.summary-total { display: flex; justify-content: space-between; margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 10px; color: #1e293b; font-size: 1.1rem; }

.success-screen { text-align: center; padding: 40px 20px; }
.check-icon { font-size: 4rem; margin-bottom: 20px; display: block; }
.btn-restart { margin-top: 30px; background: transparent; border: 2px solid #2563eb; color: #2563eb; padding: 10px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; }
.btn-restart:hover { background: #eff6ff; }

.loading-state { color: white; display: flex; flex-direction: column; align-items: center; }
.spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .public-page {
    padding: 10px;
  }
  .booking-card {
    padding: 20px;
    min-height: auto;
  }
  .actions {
    flex-direction: column;
  }
  .btn-secondary {
    width: 100%;
  }
}
</style>
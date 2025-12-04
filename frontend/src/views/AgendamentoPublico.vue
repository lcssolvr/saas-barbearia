<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const slug = route.params.slug;

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const barbearia = ref(null);
const loading = ref(true);
const sucesso = ref(false);

const form = ref({
  cliente_nome: '',
  data_hora: '',
  servico_id: ''
});

onMounted(async () => {
  try {
    const res = await axios.get(`${baseURL}/public/barbearia/${slug}`);
    barbearia.value = res.data;
  } catch (error) {
    alert("Barbearia não encontrada ou link inválido.");
  } finally {
    loading.value = false;
  }
});

const confirmarAgendamento = async () => {
  if (!form.value.cliente_nome || !form.value.data_hora || !form.value.servico_id) {
    return alert("Preencha todos os campos!");
  }

  try {
    await axios.post(`${baseURL}/public/agendamentos`, {
      barbearia_id: barbearia.value.id,
      ...form.value
    });
    sucesso.value = true;
  } catch (error) {
    alert("Erro ao agendar: " + (error.response?.data?.error || error.message));
  }
};
</script>

<template>
  <div class="public-container">
    <div v-if="loading" class="loading">Carregando...</div>

    <div v-else-if="sucesso" class="card success-card">
      <div class="icon">✅</div>
      <h2>Agendamento Confirmado!</h2>
      <p>Obrigado, {{ form.cliente_nome }}. Te esperamos lá!</p>
      <button @click="sucesso = false; form.cliente_nome=''" class="btn-primary">Agendar outro</button>
    </div>

    <div v-else-if="barbearia" class="card">
      <header>
        <h1>{{ barbearia.nome }}</h1>
        <p>Agendamento Online</p>
      </header>

      <div class="form-group">
        <label>Escolha o Serviço:</label>
        <div class="servicos-list">
          <div 
            v-for="s in barbearia.servicos" 
            :key="s.id" 
            class="servico-item"
            :class="{ selected: form.servico_id === s.id }"
            @click="form.servico_id = s.id"
          >
            <span>{{ s.nome }}</span>
            <strong>R$ {{ s.preco }}</strong>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Seu Nome:</label>
        <input v-model="form.cliente_nome" type="text" placeholder="Ex: João da Silva" />
      </div>

      <div class="form-group">
        <label>Data e Hora:</label>
        <input v-model="form.data_hora" type="datetime-local" />
      </div>

      <button @click="confirmarAgendamento" class="btn-primary">Confirmar Horário</button>
    </div>
  </div>
</template>

<style scoped>
.public-container { min-height: 100vh; background: #f8fafc; display: flex; justify-content: center; padding: 20px; font-family: sans-serif; }
.card { background: white; width: 100%; max-width: 400px; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); height: fit-content; }

header { text-align: center; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;}
h1 { margin: 0; color: #1e293b; font-size: 1.5rem; }

.form-group { margin-bottom: 20px; }
label { display: block; margin-bottom: 8px; font-weight: bold; color: #475569; }
input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }

.servico-item { display: flex; justify-content: space-between; padding: 12px; border: 1px solid #e2e8f0; margin-bottom: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.servico-item:hover { background: #f1f5f9; }
.servico-item.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }

.btn-primary { width: 100%; background: #2563eb; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; }
.btn-primary:hover { background: #1d4ed8; }

.success-card { text-align: center; padding: 50px 30px; }
.icon { font-size: 3rem; margin-bottom: 15px; }
</style>
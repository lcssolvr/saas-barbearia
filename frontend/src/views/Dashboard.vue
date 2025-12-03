<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api'; // O axios configurado
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const agendamentos = ref([]);
const loading = ref(true);
const authStore = useAuthStore();
const router = useRouter();

const fetchAgenda = async () => {
  try {
    const response = await api.get('/agendamentos');
    agendamentos.value = response.data;
  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    if(error.response && error.response.status === 401) {
        alert("Sessão expirada");
        logout();
    }
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
};

onMounted(() => {
  fetchAgenda();
});
</script>

<template>
  <div class="dashboard">
    <header>
      <h2>Painel da Barbearia</h2>
      <button @click="logout" class="btn-sair">Sair</button>
    </header>

    <main>
      <h3>Próximos Agendamentos</h3>
      
      <div v-if="loading">Carregando...</div>
      
      <div v-else-if="agendamentos.length === 0">
        Nenhum agendamento encontrado.
      </div>

      <ul v-else class="agenda-list">
        <li v-for="item in agendamentos" :key="item.id" class="card-agenda">
          <span class="hora">{{ new Date(item.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
          <div class="info">
            <strong>{{ item.cliente_nome }}</strong>
            <span class="status" :class="item.status">{{ item.status }}</span>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.dashboard { 
    padding: 20px; 
    font-family: sans-serif; 
}

header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 20px; 
    border-bottom: 1px solid #ccc; 
    padding-bottom: 10px; 
}

.btn-sair { 
    background: #e74c3c; 
    color: white; 
    border: none; 
    padding: 5px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
}

.agenda-list { 
    list-style: none; 
    padding: 0; 
}

.card-agenda { 
    background: #fff; 
    border: 1px solid #ddd; 
    padding: 15px; 
    margin-bottom: 10px; 
    border-radius: 6px; 
    display: flex; 
    align-items: center; 
    gap: 15px; 
}

.hora { 
    font-size: 1.2rem; 
    font-weight: 
    bold; 
    color: #2c3e50; 
}

.status { 
    font-size: 0.8rem; 
    padding: 2px 6px; 
    border-radius: 4px; 
    text-transform: uppercase; 
}

.status.pendente { 
    background: #f1c40f; 
    color: #000; 
}
</style>
<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api'; 
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import ModalAgendamento from '../components/ModalAgendamento.vue';

const agendamentos = ref([]);
const loading = ref(true);
const modalAberto = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const fetchAgenda = async () => {
  loading.value = true;
  try {
    const response = await api.get('/agendamentos');
    agendamentos.value = response.data.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    loading.value = false;
  }
};

const criarAgendamento = async (dadosDoFormulario) => {
  try {
    await api.post('/agendamentos', dadosDoFormulario);
    
    modalAberto.value = false;
    fetchAgenda();
    alert('Agendado com sucesso!');
  } catch (error) {
    alert('Erro ao agendar: ' + error.message);
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
      <div>
        <button @click="modalAberto = true" class="btn-novo">+ Novo Agendamento</button>
        <button @click="logout" class="btn-sair">Sair</button>
      </div>
    </header>

    <main>
      <h3>Agenda</h3>
      
      <div v-if="loading">Carregando...</div>
      
      <ul v-else class="agenda-list">
        <li v-for="item in agendamentos" :key="item.id" class="card-agenda">
            <span class="hora">
                {{ new Date(item.data_hora).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour: '2-digit', minute:'2-digit'}) }}
            </span>

            <div class="info">
                <div class="cliente-linha">
                    <strong>{{ item.cliente_nome }}</strong>
                    <span v-if="item.servicos" class="servico-tag">
                        {{ item.servicos.nome }}
                    </span>
                </div>
                <div class="detalhes-extras">
                    <small v-if="item.servicos">R$ {{ item.servicos.preco }}</small>
                    <span class="status" :class="item.status">{{ item.status }}</span>
                </div>
            </div>
        </li>
      </ul>
    </main>

    <ModalAgendamento 
      :isOpen="modalAberto" 
      @close="modalAberto = false"
      @save="criarAgendamento"
    />
  </div>
</template>

<style scoped>
.btn-novo { 
    background: #2980b9; 
    color: white; 
    border: none; 
    padding: 5px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
    margin-right: 10px; 
}

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
    font-size: 1.1rem; 
    font-weight: bold; 
    color: #2c3e50; 
    min-width: 120px;
}

.status { 
    font-size: 0.8rem; 
    padding: 2px 6px; 
    border-radius: 4px; 
    text-transform: uppercase; 
    background: #eee; 
}

.cliente-linha {
    display: flex;
    align-items: center;
    gap: 10px;
}

.servico-tag {
    font-size: 0.85rem;
    color: #555;
    background-color: #f0f0f0;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid #ddd;
}

.detalhes-extras {
    display: flex;
    gap: 10px;
    margin-top: 4px;
    font-size: 0.9rem;
    color: #666;
}

</style>
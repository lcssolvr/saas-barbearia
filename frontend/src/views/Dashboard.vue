<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../services/api'; 
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import ModalAgendamento from '../components/ModalAgendamento.vue';

const agendamentos = ref([]);
const loading = ref(true);
const modalAberto = ref(false);
const itemParaEditar = ref(null);

const dataFiltro = ref(new Date().toISOString().split('T')[0]);

const authStore = useAuthStore();
const router = useRouter();

const totalAgendamentos = computed(() => agendamentosFiltrados.value.length);;

const faturamentoPrevisto = computed(() => {
  return agendamentosFiltrados.value.reduce((acc, item) => {
    if (item.status === 'cancelado' || item.status === 'pendente') return acc;
    const preco = item.servicos ? Number(item.servicos.preco) : 0;
    return acc + preco;
  }, 0);
});

const agendamentosFiltrados = computed(() => {
  return agendamentos.value.filter(item => {
    const dataItem = item.data_hora.slice(0, 10);
    return dataItem === dataFiltro.value;
  });
});

const irParaHoje = () => {
  dataFiltro.value = new Date().toISOString().split('T')[0];
};

const mudarData = (dias) => {
  const dataAtual = new Date(dataFiltro.value);
  dataAtual.setDate(dataAtual.getDate() + dias);
  dataFiltro.value = dataAtual.toISOString().split('T')[0];
};

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

const cancelarAgendamento = async (id) => {
  if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
  try {
    await api.delete(`/agendamentos/${id}`);
    agendamentos.value = agendamentos.value.filter(item => item.id !== id);
  } catch (error) {
    alert('Erro ao cancelar: ' + error.message);
  }
};

const salvarAgendamento = async (dados) => {
  try {
    if (dados.id) {
      await api.put(`/agendamentos/${dados.id}`, dados);
      alert('Atualizado com sucesso!');
    } else {
      await api.post('/agendamentos', dados);
      alert('Criado com sucesso!');
    }
    
    modalAberto.value = false;
    fetchAgenda();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
};

const abrirEdicao = (item) => {
  itemParaEditar.value = item;
  modalAberto.value = true;
};

const abrirNovo = () => {
  itemParaEditar.value = null;
  modalAberto.value = true;
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
};

onMounted(() => fetchAgenda());
</script>

<template>
  <div class="dashboard">
    <header>
      <h2>Painel da Barbearia</h2>
      <div class="header-actions">
        <button @click="router.push('/servicos')" class="btn-servicos">Meus Serviços</button>
        <button @click="abrirNovo" class="btn-novo">+ Novo Agendamento</button>
        <button @click="logout" class="btn-sair">Sair</button>
      </div>
    </header>

    <main>
      <div class="filter-bar">
        <button @click="mudarData(-1)" class="btn-nav">❮</button>
        
        <input type="date" v-model="dataFiltro" class="date-input" />
        
        <button @click="mudarData(1)" class="btn-nav">❯</button>
        
        <button @click="irParaHoje" class="btn-hoje">Hoje</button>
      </div>

      <div class="stats-container">
        <div class="stat-card blue">
          <span class="stat-title">Agendamentos</span>
          <strong class="stat-value">{{ totalAgendamentos }}</strong>
        </div>

        <div class="stat-card green">
          <span class="stat-title">Faturamento</span>
          <strong class="stat-value">R$ {{ faturamentoPrevisto.toFixed(2) }}</strong>
        </div>
      </div>

      <h3>Agenda de {{ new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR') }}</h3>
      
      <div v-if="loading">Carregando...</div>

      <div v-else-if="agendamentosFiltrados.length === 0" class="empty-state">
        Nenhum agendamento para este dia.
      </div>
      
      <ul v-else class="agenda-list">
        <li v-for="item in agendamentosFiltrados" :key="item.id" class="card-agenda" :class="item.status">
             <div class="card-left">
                <div class="hora-box">
                   {{ new Date(item.data_hora).toLocaleString('pt-BR', {hour: '2-digit', minute:'2-digit'}) }}
                </div>
                <div class="info-cliente">
                  <strong>{{ item.cliente_nome }}</strong>
                  <span v-if="item.servicos" class="servico-tag">{{ item.servicos.nome }}</span>
                  <span v-if="item.status !== 'pendente'" class="status-badge" :class="item.status">{{ item.status }}</span>
                </div>
             </div>
             <div class="card-right">
                 <div class="financeiro" v-if="item.servicos">R$ {{ item.servicos.preco }}</div>
                 <button @click="abrirEdicao(item)" class="btn-icon btn-edit">✎</button>
                 <button @click="cancelarAgendamento(item.id)" class="btn-icon btn-delete">✕</button>
             </div>
        </li>
      </ul>
    </main>

    <ModalAgendamento 
      :isOpen="modalAberto" 
      :agendamentoParaEditar="itemParaEditar" 
      @close="modalAberto = false"
      @save="salvarAgendamento"
    />
  </div>
</template>

<style scoped>
.dashboard { padding: 20px; font-family: 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 15px; flex-wrap: wrap; gap: 15px;}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stats-container { display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }
.stat-card { flex: 1; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; border: 1px solid #e2e8f0; min-width: 200px; }
.stat-title { color: #64748b; font-size: 0.9rem; text-transform: uppercase; font-weight: 600; }
.stat-value { font-size: 2rem; font-weight: bold; margin-top: 5px; }
.stat-card.blue { border-bottom: 4px solid #3b82f6; } .stat-card.blue .stat-value { color: #3b82f6; }
.stat-card.green { border-bottom: 4px solid #10b981; } .stat-card.green .stat-value { color: #10b981; }

.agenda-list { list-style: none; padding: 0; }
.card-agenda { background: white; border: 1px solid #e2e8f0; border-left: 5px solid #3b82f6; padding: 15px 20px; margin-bottom: 12px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; transition: transform 0.1s; flex-wrap: wrap; gap: 15px; }
.card-agenda.concluido { border-left-color: #10b981; }
.card-agenda.cancelado { border-left-color: #ef4444; }
.card-agenda:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.date-input { padding: 8px 15px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; color: #334155;font-family: inherit; }

.card-left { display: flex; align-items: center; gap: 20px; flex: 1; min-width: 250px; }
.hora-box { display: flex; flex-direction: column; align-items: center; font-weight: bold; font-size: 1.2rem; color: #2c3e50; background: #f8fafc; padding: 5px 10px; border-radius: 6px; min-width: 60px; }
.hora-box small { font-size: 0.7rem; color: #64748b; font-weight: normal; }

.info-cliente { display: flex; flex-direction: column; }
.info-cliente strong { font-size: 1.1rem; color: #1e293b; }
.servico-tag { font-size: 0.85rem; color: #64748b; margin-top: 2px; }
.status-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block; width: fit-content; text-transform: uppercase; background: #eee; color: #64748b; }
.status-badge.concluido { background: #d1fae5; color: #065f46; }
.status-badge.cancelado { background: #fee2e2; color: #991b1b; }

.card-right { display: flex; align-items: center; gap: 10px; }
.financeiro { font-weight: bold; color: #10b981; font-size: 1rem; margin-right: 10px; }

.btn-icon { width: 36px; height: 36px; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: 0.2s; }
.btn-edit { background: #eff6ff; color: #2563eb; } .btn-edit:hover { background: #2563eb; color: white; }
.btn-delete { background: #fef2f2; color: #ef4444; } .btn-delete:hover { background: #ef4444; color: white; }
.btn-novo { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: 10px; }
.btn-novo:hover { background: #1d4ed8; }
.btn-sair { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: 10px; }
.btn-servicos { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-left: 10px;}
.btn-servicos:hover { background: #475569; }
.btn-nav { background: #f1f5f9; border: 1px solid #cbd5e1; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569; }
.btn-nav:hover { background: #e2e8f0; }
.btn-hoje { background: #e0f2fe; color: #0284c7; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-hoje:hover { background: #bae6fd; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; border: 2px dashed #e2e8f0; border-radius: 8px; }

.filter-bar { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; flex-wrap: wrap; }

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 15px;
  }

  .header-actions {
    justify-content: center;
    width: 100%;
  }

  .header-actions button {
    margin-left: 5px;
    margin-right: 5px;
    font-size: 0.9rem;
    padding: 8px 12px;
    flex: 1;
  }

  .stat-card {
    min-width: 90%;
  }

  .filter-bar {
    width: 95%;
    justify-content: space-between;
  }
  
  .card-agenda {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .card-left {
    width: 100%;
  }

  .card-right {
    width: 100%;
    justify-content: flex-end;
    border-top: 1px solid #f1f5f9;
    padding-top: 10px;
  }
}
</style>
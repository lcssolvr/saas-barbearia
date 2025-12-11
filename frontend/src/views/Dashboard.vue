<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../services/api'; 
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import DashboardDono from '../components/dashboard/DashboardDono.vue';
import DashboardBarbeiro from '../components/dashboard/DashboardBarbeiro.vue';
import DashboardCliente from '../components/dashboard/DashboardCliente.vue';
import DashboardAdmin from '../components/dashboard/DashboardAdmin.vue';
import ModalAgendamento from '../components/ModalAgendamento.vue';

const agendamentos = ref([]);
const loading = ref(true);
const modalAberto = ref(false);
const itemParaEditar = ref(null);
const userProfile = ref({});
let intervalId = null;

const dataFiltro = ref(new Date().toISOString().split('T')[0]);

const authStore = useAuthStore();
const router = useRouter();

const agendamentosFiltrados = computed(() => {
  return agendamentos.value.filter(item => {
    const dataItem = item.data_hora.slice(0, 10);
    return dataItem === dataFiltro.value;
  });
});

const loadData = async (showLoading = true) => {
    if (showLoading) loading.value = true;
    try {
        const { data: me } = await api.get('/me');
        userProfile.value = me;

        const response = await api.get('/agendamentos');
        agendamentos.value = response.data.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
    } finally {
        if (showLoading) loading.value = false;
    }
};

const logout = async () => {
  await authStore.logout();
  router.push('/');
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
    loadData(false);
  } catch (error) {
    alert('Erro: ' + error.message);
  }
};

onMounted(() => {
    loadData(true);
});

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div class="dashboard-container">
    <div v-if="loading" class="loading-screen">Carregando seu painel...</div>
    
    <div v-else>
        
        <DashboardDono 
            v-if="userProfile.tipo === 'dono'" 
            :user="userProfile" 
            :agendamentos="agendamentos"
            :barbeariaSlug="userProfile.barbearia_slug"
            @logout="logout"
        />

        <DashboardAdmin 
            v-else-if="userProfile.tipo === 'super_admin'"
            :user="userProfile"
        />

        <DashboardBarbeiro 
            v-else-if="userProfile.tipo === 'barbeiro'"
            :user="userProfile"
            :agendamentos="agendamentos"
            @refresh="loadData(false)"
        />

        <DashboardCliente 
            v-else-if="userProfile.tipo === 'cliente'"
            :user="userProfile"
            :agendamentos="agendamentos"
        />

        <div v-else class="generic-dash">
            <h2>Bem-vindo, {{ userProfile.nome }}</h2>
            <p>Seu perfil é: {{ userProfile.tipo }}</p>
        </div>

        <div class="global-actions">
           <button @click="logout" class="btn-sair-global">Sair</button>
        </div>
    </div>

    <ModalAgendamento 
      :isOpen="modalAberto" 
      :agendamentoParaEditar="itemParaEditar" 
      @close="modalAberto = false"
      @save="salvarAgendamento"
    />
  </div>
</template>

<style scoped>
.dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
.loading-screen { text-align: center; padding: 50px; color: #64748b; }
.global-actions { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
.btn-sair-global { background: #fee2e2; color: #ef4444; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
.btn-sair-global:hover { background: #ef4444; color: white; }
</style>
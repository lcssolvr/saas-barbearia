<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const tenants = ref([]);
const loading = ref(true);
const router = useRouter();

const fetchTenants = async () => {
  try {
    const response = await api.get('/admin/tenants');
    tenants.value = response.data;
  } catch (error) {
    alert("Erro: " + error.response?.data?.error || "Acesso negado");
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (tenant) => {
  const novoStatus = tenant.status === 'ativo' ? 'bloqueado' : 'ativo';
  if (!confirm(`Deseja mudar o status de ${tenant.nome} para ${novoStatus.toUpperCase()}?`)) return;

  try {
    await api.patch(`/admin/tenants/${tenant.id}`, { status: novoStatus });
    tenant.status = novoStatus;
  } catch (error) {
    alert("Erro ao atualizar.");
  }
};

const mudarPlano = async (tenant, novoPlano) => {
  try {
    await api.patch(`/admin/tenants/${tenant.id}`, { plano: novoPlano });
    alert(`Plano de ${tenant.nome} alterado para ${novoPlano}`);
  } catch (error) {
    alert("Erro ao mudar plano.");
  }
};

onMounted(() => fetchTenants());
</script>

<template>
  <div class="admin-container">
    <header>
      <h1>🛡️ Super Admin - CONTROLE</h1>
      <button @click="router.push('/dashboard')" class="btn-voltar">Voltar ao App</button>
    </header>

    <div v-if="loading">Carregando dados...</div>

    <table v-else class="tabela-admin">
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Plano</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tenants" :key="t.id" :class="{ bloqueado: t.status === 'bloqueado' }">
          <td>
            <strong>{{ t.nome }}</strong><br>
            <small>{{ t.id }}</small>
          </td>
          <td>
            <select :value="t.plano" @change="mudarPlano(t, $event.target.value)">
              <option value="free">Free</option>
              <option value="pro">Pro (R$ 99)</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </td>
          <td>
            <span class="badge" :class="t.status">{{ t.status }}</span>
          </td>
          <td>
            <button @click="toggleStatus(t)" class="btn-block">
              {{ t.status === 'ativo' ? '🔒 Bloquear' : '🔓 Desbloquear' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.admin-container { padding: 40px; max-width: 1000px; margin: 0 auto; font-family: sans-serif; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { color: #2c3e50; }

.tabela-admin { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f8fafc; font-weight: bold; color: #475569; }

tr.bloqueado { background-color: #fef2f2; opacity: 0.8; }
tr.bloqueado td { color: #991b1b; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; }
.badge.ativo { background: #dcfce7; color: #166534; }
.badge.bloqueado { background: #fee2e2; color: #991b1b; }

select { padding: 5px; border-radius: 4px; border: 1px solid #ccc; }

.btn-block { padding: 6px 12px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 4px; font-weight: bold; }
.btn-block:hover { background: #f1f5f9; }

.btn-voltar { background: #334155; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
</style>
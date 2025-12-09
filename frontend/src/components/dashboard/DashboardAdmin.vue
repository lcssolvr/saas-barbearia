<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../services/api';

const props = defineProps(['user']);
const tenants = ref([]);
const loading = ref(true);

const search = ref('');
const filterStatus = ref('');
const filterPlan = ref('');

const loadTenants = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/barbearias');
        tenants.value = data;
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar barbearias");
    } finally {
        loading.value = false;
    }
};

const filteredTenants = computed(() => {
    return tenants.value.filter(t => {
        const searchLower = search.value.toLowerCase();
        const matchesSearch = t.nome.toLowerCase().includes(searchLower) || t.slug.toLowerCase().includes(searchLower);
        const matchesStatus = filterStatus.value ? t.status === filterStatus.value : true;
        const matchesPlan = filterPlan.value ? t.plano === filterPlan.value : true;

        return matchesSearch && matchesStatus && matchesPlan;
    });
});

const updateTenant = async (id, payload) => {
    if (!confirm("Confirmar alteração?")) return;
    try {
        await api.patch(`/barbearias/${id}`, payload);
        loadTenants();
    } catch (e) {
        alert("Erro ao atualizar status/plano");
    }
};

onMounted(() => {
    loadTenants();
});
</script>

<template>
    <div class="dash-admin">
        <header>
            <h2>🛡️ Painel Super Admin</h2>
            <p>Gerencie todas as barbearias cadastradas</p>
        </header>

        <div class="filters-bar">
            <div class="search-box">
                <input v-model="search" placeholder="Buscar por nome ou slug..." class="search-input" />
            </div>
            
            <div class="select-box">
                <label>Status:</label>
                <select v-model="filterStatus">
                    <option value="">Todos</option>
                    <option value="ativo">Ativos</option>
                    <option value="bloqueado">Bloqueados</option>
                </select>
            </div>

            <div class="select-box">
                <label>Plano:</label>
                <select v-model="filterPlan">
                    <option value="">Todos</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                </select>
            </div>
        </div>

        <div class="table-container">
            <table v-if="filteredTenants.length > 0">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Slug</th>
                        <th>Plano</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in filteredTenants" :key="t.id">
                        <td>{{ t.nome }}</td>
                        <td>{{ t.slug }}</td>
                        <td>
                            <span class="badge" :class="t.plano">{{ t.plano }}</span>
                        </td>
                        <td>
                            <span class="badge" :class="t.status">{{ t.status }}</span>
                        </td>
                        <td class="actions-cell">
                             <div class="action-group">
                                <label>Plano:</label> 
                                <select :value="t.plano" @change="updateTenant(t.id, { plano: $event.target.value })" class="mini-select">
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                </select>
                             </div>
                             
                             <button 
                                v-if="t.status === 'ativo'"
                                @click="updateTenant(t.id, { status: 'bloqueado' })" 
                                class="btn-block"
                             >Bloquear</button>
                             <button 
                                v-else
                                @click="updateTenant(t.id, { status: 'ativo' })" 
                                class="btn-activate"
                             >Ativar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="empty-state">
                <p>Nenhuma barbearia encontrada com os filtros atuais.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dash-admin { padding: 20px; font-family: 'Segoe UI', sans-serif; }
header { margin-bottom: 30px; }
header h2 { color: #1e293b; margin-bottom: 5px; }

.filters-bar { 
    display: flex; 
    gap: 20px; 
    background: white; 
    padding: 20px; 
    border-radius: 12px; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 25px;
    align-items: flex-end;
    flex-wrap: wrap;
}

.search-box { flex: 2; min-width: 250px; }
.search-input { width: 90%; padding: 10px 15px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }

.select-box { flex: 1; min-width: 150px; }
.select-box label { display: block; margin-bottom: 5px; color: #64748b; font-size: 0.9rem; font-weight: bold; }
.select-box select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; }

.table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 0.85rem; }
tr:hover { background: #f8fafc; }

.badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.badge.ativo { background: #dcfce7; color: #166534; }
.badge.bloqueado { background: #fee2e2; color: #991b1b; }
.badge.pro { background: #dbeafe; color: #1e40af; }
.badge.free { background: #f1f5f9; color: #64748b; }

.actions-cell { display: flex; align-items: center; gap: 15px; }
.action-group { display: flex; align-items: center; gap: 5px; font-size: 0.9rem; color: #64748b; }
.mini-select { padding: 5px; border-radius: 4px; border: 1px solid #cbd5e1; }

.btn-block { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.btn-block:hover { background: #dc2626; }
.btn-activate { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
.btn-activate:hover { background: #059669; }

.empty-state { padding: 40px; text-align: center; color: #94a3b8; font-style: italic; }
</style>

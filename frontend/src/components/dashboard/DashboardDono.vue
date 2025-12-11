<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import api from '../../services/api';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  registerables
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(...registerables)

const props = defineProps(['agendamentos', 'user', 'barbeariaSlug']);
const emit = defineEmits(['refresh', 'logout']);
const chartOptions = { responsive: true, maintainAspectRatio: false };

const servicos = ref([]);
const novoServico = ref({ nome: '', preco: '', duracao_minutos: 30 });
const editingId = ref(null);
let interval = null;

const loadServicos = async () => {
    try {
        const { data } = await api.get('/servicos');
        servicos.value = data;
    } catch (e) {
        console.error("Erro ao carregar serviços", e);
    }
};

const criarServico = async () => {
    if (!novoServico.value.nome || !novoServico.value.preco) return alert("Preencha nome e preço");
    try {
        await api.post('/servicos', novoServico.value);
        novoServico.value = { nome: '', preco: '', duracao_minutos: 30 };
        loadServicos();
    } catch (e) {
        alert("Erro ao criar serviço");
    }
};

const deletarServico = async (id) => {
    if (!confirm("Tem certeza?")) return;
    try {
        await api.delete(`/servicos/${id}`);
        loadServicos();
    } catch (e) {
        alert("Erro ao remover serviço");
    }
};

const iniciarEdicao = (servico) => {
    editingId.value = servico.id;
};

const salvarEdicao = async (servico) => {
    try {
        await api.put(`/servicos/${servico.id}`, {
            nome: servico.nome,
            preco: servico.preco,
            duracao_minutos: servico.duracao_minutos
        });
        editingId.value = null;
        loadServicos();
    } catch (e) {
        alert("Erro ao atualizar");
    }
};

const cancelarEdicao = () => {
    editingId.value = null;
    loadServicos();
};

onMounted(() => {
    loadServicos();
    
    // Auto refresh dashboard data
    interval = setInterval(() => {
        emit('refresh');
    }, 10000);
});

onUnmounted(() => {
    if (interval) clearInterval(interval);
});

const revenueData = computed(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const counts = last7Days.map(date => {
        return props.agendamentos
            .filter(a => a.status === 'concluido' && a.data_hora.startsWith(date))
            .reduce((acc, curr) => acc + (curr.servicos?.preco || 0), 0);
    });

    return {
        labels: last7Days.map(d => d.split('-').slice(1).join('/')),
        datasets: [{ label: 'Faturamento (R$)', backgroundColor: '#3b82f6', data: counts }]
    };
});

const serviceData = computed(() => {
    const counts = {};
    props.agendamentos
        .filter(a => a.status === 'concluido')
        .forEach(a => {
            const s = a.servicos?.nome || 'Outros';
            counts[s] = (counts[s] || 0) + 1;
        });
    
    return {
        labels: Object.keys(counts),
        datasets: [{
            backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ec4899'],
            data: Object.values(counts)
        }]
    };
});


const faturamentoHoje = computed(() => {
    const hoje = new Date().toISOString().split('T')[0];
    return props.agendamentos
        .filter(a => a.status === 'concluido' && a.data_hora.startsWith(hoje))
        .reduce((acc, curr) => acc + (curr.servicos?.preco || 0), 0)
        .toFixed(2);
});

const ocupacaoHoje = computed(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = props.agendamentos.filter(a => a.status !== 'cancelado' && a.data_hora.startsWith(hoje)).length;
    const cap = 20; 
    return Math.min(Math.round((agendamentosHoje / cap) * 100), 100);
});

const ticketMedio = computed(() => {
    const concluidos = props.agendamentos.filter(a => a.status === 'concluido');
    const total = concluidos.reduce((acc, curr) => acc + (curr.servicos?.preco || 0), 0);
    return concluidos.length ? (total / concluidos.length).toFixed(2) : '0.00';
});

const topBarbeiro = computed(() => {
    const counts = {};
    const hoje = new Date().toISOString().split('T')[0]; // UTC Date matching existing logic

    props.agendamentos
        .filter(a => a.status === 'concluido' && a.data_hora.startsWith(hoje))
        .forEach(a => {
           // Verifica se é objeto (join unico) ou array (join multiplo)
           let nome = 'Desconhecido';
           if (a.usuarios) {
               if (Array.isArray(a.usuarios)) {
                   nome = a.usuarios[0]?.nome || 'Desconhecido';
               } else {
                   nome = a.usuarios.nome || 'Desconhecido';
               }
           }
           
           counts[nome] = (counts[nome] || 0) + 1;
        });
    
    let max = 0;
    let best = '-';
    for (const [nome, qtd] of Object.entries(counts)) {
        if (qtd > max) {
            max = qtd;
            best = nome;
        }
    }
    return { name: best, count: max };
});

const shareLink = () => {
    const url = `${window.location.origin}/agendar/${props.barbeariaSlug}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado! Envie para seus clientes: ' + url);
};

</script>

<template>
    <div class="dashboard-dono">
        <header class="dash-header">
            <div>
                <h2>Olá, {{ user.nome }}</h2>
                <p class="subtitle">Visão geral do seu negócio</p>
            </div>
            <div class="header-actions">
                <button @click="shareLink" class="btn-share">🔗 Compartilhar Link</button>
            </div>
        </header>

        <div class="kpi-grid">
            <div class="kpi-card">
                <h3>💰 Faturamento Hoje</h3>
                <p class="value">R$ {{ faturamentoHoje }}</p>
            </div>
            
            <div class="kpi-card">
                <h3>📊 Ocupação (Est.)</h3>
                <p class="value">{{ ocupacaoHoje }}%</p>
                <span class="status">{{ ocupacaoHoje > 50 ? 'Movimentado' : 'Tranquilo' }}</span>
            </div>

            <div class="kpi-card">
                <h3>📈 Ticket Médio</h3>
                <p class="value">R$ {{ ticketMedio }}</p>
            </div>
             <div class="kpi-card">
                <h3>🏆 Top Barbeiro</h3>
                <p class="value">{{ topBarbeiro.name }}</p>
                <small>{{ topBarbeiro.count }} cortes total</small>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-container">
                <h3>Faturamento (7 dias)</h3>
                <div class="relative-chart-wrapper">
                    <Bar :data="revenueData" :options="chartOptions" />
                </div>
            </div>
            <div class="chart-container">
                <h3>Distribuição de Serviços</h3>
                <div class="relative-chart-wrapper">
                    <Doughnut :data="serviceData" :options="chartOptions" />
                </div>
            </div>
        </div>

        <div class="services-section">
            <div class="header-row">
                <h3>🛠️ Meus Serviços</h3>
            </div>
            
            <div class="add-service-form">
                <input v-model="novoServico.nome" placeholder="Nome (ex: Corte)" class="input-light" />
                <input v-model="novoServico.preco" type="number" placeholder="Preço (R$)" class="input-light" />
                <input v-model="novoServico.duracao_minutos" type="number" placeholder="Minutos" class="input-light" style="width: 80px;" />
                <button @click="criarServico" class="btn-create">+ Adicionar</button>
            </div>

            <div class="services-list">
                <div v-for="s in servicos" :key="s.id" class="service-item">
                    <div v-if="editingId === s.id" class="edit-mode">
                        <input v-model="s.nome" class="input-light" />
                        <input v-model="s.preco" type="number" class="input-light" style="width: 70px;" />
                        <input v-model="s.duracao_minutos" type="number" class="input-light" style="width: 60px;" />
                        <div class="actions">
                            <button @click="salvarEdicao(s)" class="btn-save">💾</button>
                            <button @click="cancelarEdicao" class="btn-cancel">❌</button>
                        </div>
                    </div>
                    <div v-else class="view-mode">
                        <div class="info">
                            <strong>{{ s.nome }}</strong>
                            <span>R$ {{ s.preco }} • {{ s.duracao_minutos }} min</span>
                        </div>
                        <div class="actions">
                            <button @click="iniciarEdicao(s)" class="btn-icon">✏️</button>
                            <button @click="deletarServico(s.id)" class="btn-icon delete">🗑️</button>
                        </div>
                    </div>
                </div>
                <p v-if="servicos.length === 0" class="empty">Nenhum serviço cadastrado.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.subtitle { color: #64748b; margin: 5px 0 0 0; }
.header-actions { display: flex; gap: 10px; }
.btn-share { background: #8b5cf6; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.btn-share:hover { background: #7c3aed; }
.kpi-grid { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 40px; }
.kpi-card { flex: 1; min-width: 200px; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.kpi-card h3 { color: #64748b; font-size: 0.9rem; text-transform: uppercase; margin: 0 0 10px 0; }
.kpi-card .value { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
.kpi-card .trend { color: #10b981; font-size: 0.85rem; font-weight: bold; display: block; margin-top: 5px; }

@media (max-width: 768px) {
    .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; }
    .header-actions { width: 100%; }
    .btn-share { width: 100%; }
    .charts-row { flex-direction: column; gap: 15px; }
    .chart-container { height: auto; min-height: 350px; width: auto; }
}

.charts-row { display: flex; gap: 20px; margin-bottom: 40px; }
.chart-container { flex: 1; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: 400px; display: flex; flex-direction: column; }
.chart-container h3 { margin-bottom: 15px; color: #334155; font-size: 1rem; }
.relative-chart-wrapper { position: relative; flex: 1; min-height: 0; }

.services-section { background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 40px; }
.services-section h3 { margin-bottom: 20px; color: #334155; }

.add-service-form { display: flex; gap: 10px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; flex-wrap: wrap; }
.input-light { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; }
.btn-create { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-left: auto; }
.btn-create:hover { background: #059669; }

.services-list { display: flex; flex-direction: column; gap: 10px; }
.service-item { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; transition: background 0.2s; }
.service-item:hover { background: #f8fafc; }

.view-mode { display: flex; justify-content: space-between; align-items: center; }
.info strong { display: block; color: #1e293b; font-size: 1.05rem; }
.info span { color: #64748b; font-size: 0.9rem; }

.actions { display: flex; gap: 8px; }
.btn-icon { background: white; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
.btn-icon:hover { background: #f1f5f9; border-color: #cbd5e1; }
.btn-icon.delete:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }

.edit-mode { display: flex; gap: 10px; align-items: center; width: 100%; flex-wrap: wrap; }
.btn-save { background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.btn-cancel { background: #94a3b8; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 10px; }
</style>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

const props = defineProps(['agendamentos', 'user', 'barbeariaSlug']);
const emit = defineEmits(['refresh', 'logout']);

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
    props.agendamentos
        .filter(a => a.status === 'concluido')
        .forEach(a => {
           const nome = a.barbeiro_nome || 'Desconhecido';
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
}
</style>

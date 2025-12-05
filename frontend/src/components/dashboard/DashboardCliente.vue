<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps(['agendamentos', 'user']);
const router = useRouter();

const cortesContagem = computed(() => {
    return props.agendamentos.filter(a => a.status === 'concluido').length % 10;
});

const ultimoAgendamento = computed(() => {
    const sorted = [...props.agendamentos].sort((a,b) => new Date(b.data_hora) - new Date(a.data_hora));
    return sorted[0];
});

const agendarNovamente = () => {
    if (ultimoAgendamento.value && ultimoAgendamento.value.barbearia_id) {
         if (props.user.barbearia_slug) {
            router.push(`/agendar/${props.user.barbearia_slug}`);
         } else {
             alert('Não foi possível identificar a barbearia. Por favor, busque novamente.');
         }
    } else {
        alert("Você ainda não tem agendamentos para repetir.");
    }
};
</script>

<template>
    <div class="dash-cliente">
        <header>
            <h2>Olá, {{ user.nome }}</h2>
            <p>Que bom te ver de novo!</p>
        </header>

        <div class="loyalty-card">
            <div class="loyalty-header">
                <h3>Cartão Fidelidade</h3>
                <span>{{ cortesContagem }}/10</span>
            </div>
            <div class="stamps">
                <div v-for="n in 10" :key="n" class="stamp" :class="{ filled: n <= cortesContagem }">
                    {{ n <= cortesContagem ? '💈' : '' }}
                </div>
            </div>
            <p class="loyalty-info">Faltam {{ 10 - cortesContagem }} cortes para o próximo grátis!</p>
        </div>

        <div class="quick-actions">
            <div class="action-card">
                <h3>🔄 Repetir Último</h3>
                <p v-if="ultimoAgendamento">{{ ultimoAgendamento.servicos?.nome || 'Serviço' }}</p>
                <p v-else>Nenhum serviço</p>
                <button @click="agendarNovamente">Agendar Agora</button>
            </div>
            <div class="action-card">
                <h3>🗓️ Meus Agendamentos</h3>
                <p>Ver histórico completo</p>
                <button class="secondary" @click="$el.querySelector('.history-list').scrollIntoView({behavior:'smooth'})">Ver Lista</button>
            </div>
        </div>

        <h3>Histórico Recente</h3>
        <ul class="history-list">
             <li v-for="item in agendamentos" :key="item.id" class="history-item">
                <div class="date-box">
                    <strong>{{ new Date(item.data_hora).getDate() }}</strong>
                    <span>{{ new Date(item.data_hora).toLocaleDateString([], {month: 'short'}) }}</span>
                </div>
                <div class="info">
                    <h4>{{ item.servicos?.nome || 'Serviço' }}</h4>
                    <p>com {{ item.barbeiro_nome || 'Barbeiro' }}</p>
                </div>
             </li>
        </ul>
    </div>
</template>

<style scoped>
.dash-cliente { padding: 10px; max-width: 600px; margin: 0 auto; }
header { margin-bottom: 20px; }

.loyalty-card { background: #1e293b; color: #fbbf24; padding: 20px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.loyalty-header { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; }
.stamps { display: flex; justify-content: space-between; gap: 5px; margin-bottom: 15px; }
.stamp { width: 30px; height: 30px; border-radius: 50%; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.stamp.filled { background: #fbbf24; color: #1e293b; box-shadow: 0 0 10px #fbbf24; }
.loyalty-info { color: #94a3b8; font-size: 0.9rem; text-align: center; }

.quick-actions { display: flex; gap: 15px; margin-bottom: 30px; }
.action-card { flex: 1; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
.action-card h3 { font-size: 0.9rem; color: #64748b; margin-bottom: 5px; }
.action-card button { width: 100%; margin-top: 10px; padding: 8px; border-radius: 6px; border: none; background: #2563eb; color: white; cursor: pointer; font-weight: 600; }
.action-card button.secondary { background: #e2e8f0; color: #475569; }

.history-list { list-style: none; padding: 0; }
.history-item { display: flex; align-items: center; gap: 15px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 10px; }
.date-box { display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 5px 10px; border-radius: 8px; min-width: 50px; }
.date-box strong { font-size: 1.2rem; color: #1e293b; }
.info h4 { margin: 0; color: #334155; }
.info p { margin: 2px 0 0 0; font-size: 0.85rem; color: #94a3b8; }
.price { margin-left: auto; font-weight: bold; color: #10b981; }
</style>

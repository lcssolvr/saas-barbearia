<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps(['user', 'agendamentos']);
const router = useRouter();

const stats = computed(() => {
    const valid = props.agendamentos.filter(a => ['concluido', 'pendente'].includes(a.status));
    const totalSpent = valid.reduce((acc, curr) => acc + (Number(curr.servicos?.preco) || 0), 0);
    return {
        visits: valid.length,
        spent: totalSpent.toFixed(2)
    };
});

const nextAppointment = computed(() => {
    const now = new Date();
    const future = props.agendamentos.filter(a => new Date(a.data_hora) > now && a.status !== 'cancelado');
    return future.sort((a,b) => new Date(a.data_hora) - new Date(b.data_hora))[0];
});

const lastAppointment = computed(() => {
    const now = new Date();
    const past = props.agendamentos.filter(a => new Date(a.data_hora) < now && a.status !== 'cancelado');
    return past.sort((a,b) => new Date(b.data_hora) - new Date(a.data_hora))[0];
});

const loyaltyCount = computed(() => {
    return props.agendamentos.filter(a => a.status === 'concluido').length % 10;
});


const repeatLast = () => {
    if (lastAppointment.value) {
        const slug = lastAppointment.value.barbearias?.slug || props.user.barbearia_slug || props.user.barbearia?.slug;
        if (slug) {
            router.push({ 
                path: `/agendar/${slug}`, 
                query: { servico_id: lastAppointment.value.servico_id } 
            });
        } else {
            alert("Erro: Não foi possível identificar a barbearia.");
        }
    } else {
        alert("Nenhum agendamento anterior para repetir.");
    }
};

const newBooking = () => {
    const slug = props.user.barbearia_slug || props.user.barbearia?.slug;
    if (slug) router.push(`/agendar/${slug}`);
    else alert("Erro: Barbearia não vinculada.");
};


const showAllHistory = ref(false);

const displayedHistory = computed(() => {
    const sorted = [...props.agendamentos].sort((a,b) => new Date(b.data_hora) - new Date(a.data_hora));
    if (showAllHistory.value) return sorted;
    return sorted.slice(0, 5);
});

const toggleHistory = () => {
    showAllHistory.value = !showAllHistory.value;
};
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
        day: d.getDate(),
        month: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        full: d.toLocaleDateString('pt-BR')
    };
};
</script>

<template>
    <div class="dashboard-cliente">
        <header class="dash-header">
            <div class="greeting">
                <h1>Olá, {{ user.nome }}</h1>
                <p>Bem-vindo ao seu painel.</p>
            </div>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="label">Total Visitas</span>
                <strong class="value">{{ stats.visits }}</strong>
            </div>
            <div class="stat-card highlight">
                <span class="label">Total Investido</span>
                <strong class="value">R$ {{ stats.spent }}</strong>
            </div>
        </div>

        <div v-if="nextAppointment" class="next-appoint-card">
            <div class="card-header">
                <h3>🗓️ Próximo Agendamento</h3>
                <span class="badge">Em Breve</span>
            </div>
            <div class="card-body">
                <div class="date-big">
                    <span class="day">{{ formatDate(nextAppointment.data_hora).day }}</span>
                    <span class="month">{{ formatDate(nextAppointment.data_hora).month }}</span>
                </div>
                <div class="info">
                    <h4>{{ nextAppointment.servicos?.nome }}</h4>
                    <p>{{ formatDate(nextAppointment.data_hora).time }} • {{ nextAppointment.usuarios?.nome }}</p>
                    <small style="color: #64748b; display: block; margin-top: 4px;">📍 {{ nextAppointment.barbearias?.nome }}</small>
                </div>
            </div>
        </div>

        <div class="loyalty-section">
            <div class="loyalty-header">
                <h3> Cartão Fidelidade </h3>
                <span>{{ loyaltyCount }}/10</span>
            </div>
            <div class="stamps-container">
                <div 
                    v-for="i in 10" 
                    :key="i" 
                    class="stamp" 
                    :class="{ filled: i <= loyaltyCount }"
                >
                    <span v-if="i <= loyaltyCount">💈</span>
                </div>
            </div>
            <p class="loyalty-msg">Faltam {{ 10 - loyaltyCount }} cortes para o seu prêmio!</p>
        </div>

        <div class="actions-grid">
            <button class="action-btn primary" @click="repeatLast" :disabled="!lastAppointment">
                <span class="icon">↺</span>
                <div class="text">
                    <strong>Repetir Último</strong>
                    <small>{{ lastAppointment?.servicos?.nome || 'Nenhum' }}</small>
                </div>
            </button>
            <button class="action-btn outline" @click="newBooking">
                <span class="icon">📅</span>
                <div class="text">
                    <strong>Novo Agendamento</strong>
                    <small>Escolher serviço</small>
                </div>
            </button>
        </div>

        <div class="history-section">
            <div class="section-header">
                <h3>Histórico</h3>
                <button @click="toggleHistory" class="link-btn">
                    {{ showAllHistory ? 'Ver Menos' : 'Ver Todos' }}
                </button>
            </div>

            <ul class="history-list">
                <li v-for="item in displayedHistory" :key="item.id" class="history-item">
                    <div class="item-date">
                        <strong>{{ formatDate(item.data_hora).day }}</strong>
                        <small>{{ formatDate(item.data_hora).month }}</small>
                    </div>
                    <div class="item-info">
                        <h4>{{ item.servicos?.nome || 'Serviço Removido' }}</h4>
                        <p>{{ item.usuarios?.nome || 'Barbeiro' }} • {{ formatDate(item.data_hora).time }}</p>
                        <small style="color: #64748b;">📍 {{ item.barbearias?.nome }}</small>
                    </div>
                    <div class="item-price">
                        R$ {{ item.servicos?.preco }}
                    </div>
                </li>
            </ul>
            <div v-if="agendamentos.length === 0" class="empty-state">
                <p>Você ainda não possui agendamentos.</p>
            </div>
        </div>

    </div>
</template>

<style scoped>
.dashboard-cliente {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', sans-serif;
    color: #1e293b;
}

.dash-header { margin-bottom: 25px; }
.dash-header h1 { font-size: 1.5rem; margin: 0; color: #0f172a; }
.dash-header p { margin: 5px 0 0; color: #64748b; }

.stats-grid { display: flex; gap: 15px; margin-bottom: 25px; }
.stat-card {
    flex: 1;
    background: white;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
}
.stat-card.highlight { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; border: none; }
.stat-card .label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 5px; }
.stat-card .value { font-size: 1.5rem; font-weight: 800; }

.next-appoint-card {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 25px;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.card-header h3 { margin: 0; font-size: 1rem; opacity: 0.95; font-weight: 600; }
.badge { background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
.card-body { display: flex; align-items: center; gap: 15px; }
.date-big { background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 65px; }
.date-big .day { font-size: 1.5rem; font-weight: 800; line-height: 1; }
.date-big .month { font-size: 0.75rem; text-transform: uppercase; margin-top: 2px; }
.info h4 { margin: 0 0 4px 0; font-size: 1.1rem; }
.info p { margin: 0; opacity: 0.9; font-size: 0.9rem; }

.loyalty-section {
    background: #1e293b;
    color: #fbbf24;
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 25px;
    box-shadow: 0 4px 15px rgba(30, 41, 59, 0.3);
}
.loyalty-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px; }
.stamps-container { display: flex; justify-content: space-between; gap: 5px; margin-bottom: 15px; }
.stamp {
    width: 32px; height: 32px;
    background: #334155;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s ease;
}
.stamp.filled { background: #fbbf24; color: #1e293b; transform: scale(1.1); box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
.loyalty-msg { text-align: center; color: #94a3b8; font-size: 0.9rem; margin: 0; }

.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
.action-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 15px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: transform 0.2s;
}
.action-btn:hover { transform: translateY(-2px); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.action-btn.primary { background: #2563eb; color: white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
.action-btn.outline { background: white; border: 1px solid #e2e8f0; color: #334155; }
.action-btn .icon { font-size: 1.5rem; }
.action-btn .text { display: flex; flex-direction: column; }
.action-btn strong { font-size: 0.9rem; }
.action-btn small { font-size: 0.75rem; opacity: 0.8; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.section-header h3 { margin: 0; font-size: 1.1rem; color: #334155; }
.link-btn { background: none; border: none; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 0.9rem; }

.history-list { list-style: none; padding: 0; margin: 0; }
.history-item {
    display: flex; align-items: center; gap: 15px;
    background: white;
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid #f1f5f9;
}
.item-date {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 8px;
    min-width: 55px;
}
.item-date strong { color: #1e293b; font-size: 1.1rem; line-height: 1; }
.item-date small { color: #64748b; font-size: 0.75rem; text-transform: uppercase; margin-top: 2px; }
.item-info h4 { margin: 0 0 2px 0; color: #334155; font-size: 1rem; }
.item-info p { margin: 0; color: #94a3b8; font-size: 0.85rem; }
.item-price { margin-left: auto; font-weight: bold; color: #10b981; }

.empty-state { text-align: center; color: #94a3b8; padding: 20px; font-style: italic; }
</style>

<script setup>
import { computed, ref, onUnmounted } from 'vue';
import api from '../../services/api';

const props = defineProps(['agendamentos', 'user']);
const emit = defineEmits(['refresh']);

const meusAgendamentos = computed(() => {
    return props.agendamentos.filter(a => {
        if (a.status === 'cancelado') return false;
        return a.barbeiro_id === props.user.id;
    }); 
});

const meusHorariosLivres = computed(() => {
    return meusAgendamentos.value
        .filter(a => a.status === 'disponivel' && a.barbeiro_id === props.user.id)
        .sort((a,b) => new Date(a.data_hora) - new Date(b.data_hora));
});

const novoHorario = ref('');

const adicionarHorario = async () => {
    if (!novoHorario.value) return alert("Selecione um horário");
    try {
        const dataISO = new Date(novoHorario.value).toISOString();
        await api.post('/disponibilidade', { data_hora: dataISO });
        emit('refresh');
        novoHorario.value = '';
    } catch (e) {
        console.error(e);
        const msg = e.response?.data?.details || e.response?.data?.error || "Erro ao criar horário";
        alert("Erro: " + msg);
    }
};

const removerHorario = async (id) => {
    if(!confirm("Remover este horário?")) return;
    try {
        await api.delete(`/disponibilidade/${id}`);
        emit('refresh');
    } catch (e) {
        alert("Erro ao remover");
    }
};

const proximoCliente = computed(() => {
    return meusAgendamentos.value
        .filter(a => a.status === 'pendente')
        .sort((a,b) => new Date(a.data_hora) - new Date(b.data_hora))[0];
});

const comissaoEstimada = computed(() => {
    const total = meusAgendamentos.value
        .filter(a => a.status === 'concluido' && a.barbeiro_id === props.user.id)
        .reduce((acc, curr) => acc + (curr.servicos?.preco || 0), 0);
    return (total * 0.5).toFixed(2);
});

const timerActive = ref(false);
const finishing = ref(false);
const timeLeft = ref(0);
const currentClient = ref(null);
let timerInterval = null;

const startService = () => {
    if (timerActive.value) return;
    if (!proximoCliente.value) return;

    currentClient.value = proximoCliente.value;

    timeLeft.value = 40 * 60;
    timerActive.value = true;

    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            finishService(false);
        }
    }, 1000);
};

const finishService = async (manual = true) => {
    if (finishing.value) return; 
    finishing.value = true;

    clearInterval(timerInterval);
    
    if (currentClient.value && currentClient.value.id) {
        try {
             await api.put(`/agendamentos/${currentClient.value.id}`, { 
                 status: 'concluido',
                 fecha_atendimento: true,
                 cliente_nome: currentClient.value.cliente_nome,
                 data_hora: currentClient.value.data_hora,
                 servico_id: currentClient.value.servico_id,
                 barbeiro_id: props.user.id
             });
             emit('refresh');
        } catch (error) {
            console.error("Erro ao finalizar", error);
            alert("Erro ao finalizar atendimento no sistema.");
        }
    }

    if (!manual) {
        alert("⏱️ O tempo de 40 minutos acabou!");
    }
    
    timerActive.value = false;
    currentClient.value = null; 
    finishing.value = false;
};

const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
    const s = (timeLeft.value % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
    <div class="dash-barbeiro">
        <h2>✂️ Olá, {{ user.nome }}</h2>
        
        <div class="hero-card" v-if="currentClient || proximoCliente">
            <span class="label">{{ timerActive ? 'Em Atendimento' : 'Próximo Cliente' }}</span>
            
            <div class="client-info">
                <h1>{{ (timerActive && currentClient) ? currentClient.cliente_nome : (proximoCliente ? proximoCliente.cliente_nome : '...') }}</h1>
                <p v-if="timerActive && currentClient">
                     {{ new Date(currentClient.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }} 
                    - {{ currentClient.servicos?.nome }}
                </p>
                <p v-else-if="proximoCliente">
                    {{ new Date(proximoCliente.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }} 
                    - {{ proximoCliente.servicos?.nome }}
                </p>
            </div>

            <div v-if="!timerActive">
                <button class="btn-start" @click="startService">▶ Iniciar Atendimento</button>
            </div>
            <div v-else class="timer-display">
                <div class="countdown">{{ formattedTime }}</div>
                <p class="timer-sub">Tempo restante</p>
                
                <button class="btn-finish-corner" @click="finishService(true)" :disabled="finishing">
                    {{ finishing ? '...' : '✓ Finalizar Atendimento' }}
                </button>
            </div>
        </div>
        <div class="hero-card empty" v-else>
            <p>Nenhum cliente próximo na fila.</p>
        </div>

        <div class="stats-row">
            <div class="stat-box">
                <span>Minha Comissão (Hoje)</span>
                <strong>R$ {{ comissaoEstimada }}</strong>
            </div>
        </div>
        
        <div class="schedule-manager">
            <h3>📅 Gerenciar Horários Livres</h3>
            <div class="add-slot-row">
                <input type="datetime-local" v-model="novoHorario" class="input-date">
                <button @click="adicionarHorario" class="btn-add">Adicionar</button>
            </div>
            
            <div class="slots-grid">
                <div v-for="slot in meusHorariosLivres" :key="slot.id" class="slot-item">
                    <span>
                        {{ new Date(slot.data_hora).toLocaleDateString([], {day: '2-digit', month: '2-digit'}) }} <br>
                        <strong>{{ new Date(slot.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</strong>
                    </span>
                    <button @click="removerHorario(slot.id)" class="btn-remove">🗑️</button>
                </div>
            </div>
            <p v-if="meusHorariosLivres.length === 0" class="empty-msg">Você não disponibilizou horários extras.</p>
        </div>

        <div class="timeline">
            <h3>Agenda de Hoje</h3>
            <ul>
                <li v-for="item in meusAgendamentos" :key="item.id" class="timeline-item" :class="item.status">
                    <span class="time">{{ new Date(item.data_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                    <div class="details">
                        <strong class="client-name">{{ item.cliente_nome }}</strong>
                        <small>{{ item.servicos?.nome }}</small>
                    </div>
                    
                    <div class="status-badge">
                        {{ item.status === 'concluido' ? 'Concluído' : (item.status === 'pendente' ? 'Pendente' : 'Cancelado') }}
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.dash-barbeiro { padding: 10px; position: relative; min-height: 80vh; }

.hero-card { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 25px; box-shadow: 0 10px 20px rgba(37,99,235,0.2); text-align: center; position: relative; overflow: hidden; }
.hero-card.empty { background: #f1f5f9; color: #64748b; }
.hero-card .label { text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem; opacity: 0.9; }
.client-info h1 { margin: 10px 0; font-size: 2.5rem; word-break: break-word; line-height: 1.1; }

.btn-start { background: white; color: #2563eb; border: none; padding: 15px 30px; border-radius: 50px; font-weight: bold; font-size: 1.1rem; cursor: pointer; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;}
.btn-start:hover { transform: scale(1.05); }

.timer-display { margin-top: 20px; }
.countdown { font-size: 4rem; font-weight: 800; line-height: 1; font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
.timer-sub { font-size: 0.9rem; opacity: 0.8; margin-top: 5px; }

.btn-finish-corner {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 50px;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
    cursor: pointer;
    z-index: 9999;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
}
.btn-finish-corner:hover { transform: translateY(-2px); background: #059669; }

.stats-row { display: flex; gap: 15px; margin-bottom: 30px; }
.stat-box { flex: 1; background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
.stat-box span { display: block; color: #64748b; font-size: 0.8rem; margin-bottom: 5px; }
.stat-box strong { font-size: 1.5rem; color: #1e293b; }

.timeline h3 { margin-bottom: 20px; color: #334155; font-size: 1.2rem; }
.timeline ul { list-style: none; padding: 0; }

.timeline-item { 
    display: flex; 
    align-items: center; 
    gap: 15px; 
    padding: 20px; 
    background: white; 
    border-radius: 12px; 
    margin-bottom: 15px; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
    border-left: 5px solid transparent;
    transition: transform 0.2s, box-shadow 0.2s;
}

.timeline-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.timeline-item.concluido {
    background: #dcfce7;
    border-left-color: #10b981;
}
.timeline-item.pendente {
    background: #fef9c3;
    border-left-color: #f59e0b; 
}
.timeline-item.cancelado {
    background: #fee2e2;
    border-left-color: #ef4444;
}

.time { 
    font-weight: 800; 
    color: #334155;
    font-size: 1.1rem; 
    background: rgba(255,255,255,0.6);
    padding: 8px 12px;
    border-radius: 8px;
    min-width: 60px;
    text-align: center;
}

.details { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    min-width: 0; 
    margin-right: 10px;
}
.details .client-name { 
    color: #0f172a; 
    font-size: 1.05rem; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
}
.details small { color: #475569; font-size: 0.9rem; margin-top: 2px; }

.status-badge {
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(255,255,255,0.5);
    color: #334155;
}

@media (max-width: 480px) {
    .timeline-item { padding: 15px; gap: 10px; }
    .time { font-size: 0.9rem; padding: 5px 8px; min-width: 50px; }
}

.schedule-manager {
    background: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.schedule-manager h3 { margin-bottom: 15px; color: #334155; font-size: 1.1rem; }

.add-slot-row { display: flex; gap: 10px; margin-bottom: 20px; }
.input-date { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; }
.btn-add { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }

.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.slot-item {
    background: #f1f5f9;
    padding: 10px;
    border-radius: 8px;
    text-align: center;
    position: relative;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.slot-item span { font-size: 0.85rem; color: #475569; line-height: 1.4; }
.slot-item strong { display: block; font-size: 1.1rem; color: #1e293b; color: #2563eb; }

.btn-remove {
    margin-top: 5px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.5;
    transition: opacity 0.2s;
}
.btn-remove:hover { opacity: 1; color: #ef4444; }
.empty-msg { color: #94a3b8; font-style: italic; font-size: 0.9rem; text-align: center; margin-top: 10px; }

</style>

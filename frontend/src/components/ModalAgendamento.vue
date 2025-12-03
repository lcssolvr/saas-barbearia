<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../services/api';

const props = defineProps(['isOpen', 'agendamentoParaEditar']);
const emit = defineEmits(['close', 'save']);

const form = ref({
  id: null,
  cliente_nome: '',
  data_hora: '',
  servico_id: '',
  status: 'pendente'
});

const listaServicos = ref([]);

onMounted(async () => {
  try {
    const response = await api.get('/servicos');
    listaServicos.value = response.data;
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
  }
});

watch(() => props.agendamentoParaEditar, (novoValor) => {
  if (novoValor) {
    form.value = {
      id: novoValor.id,
      cliente_nome: novoValor.cliente_nome,
      data_hora: novoValor.data_hora ? novoValor.data_hora.slice(0, 16) : '', 
      servico_id: novoValor.servicos?.id || novoValor.servico_id || '',
      status: novoValor.status || 'pendente'
    };
  } else {
    form.value = {
      id: null,
      cliente_nome: '',
      data_hora: '',
      servico_id: '',
      status: 'pendente'
    };
  }
});

const salvar = () => {
  if (!form.value.servico_id) {
    return alert("Por favor, selecione um serviço!");
  }
  if (!form.value.cliente_nome || !form.value.data_hora) {
    return alert("Preencha nome e data!");
  }
  
  emit('save', { ...form.value });
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ form.id ? 'Editar Agendamento' : 'Novo Agendamento' }}</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      
      <div class="form-body">
        <div class="form-group">
          <label>Nome do Cliente:</label>
          <input v-model="form.cliente_nome" type="text" placeholder="Seu nome" />
        </div>

        <div class="form-group">
          <label>Serviço:</label>
          <select v-model="form.servico_id">
            <option value="" disabled>Selecione...</option>
            <option v-for="s in listaServicos" :key="s.id" :value="s.id">
              {{ s.nome }} (R$ {{ s.preco }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Data e Hora:</label>
          <input v-model="form.data_hora" type="datetime-local" />
        </div>
        
        <div class="form-group" v-if="form.id">
           <label>Status:</label>
           <select v-model="form.status">
              <option value="pendente">Pendente</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
           </select>
        </div>
      </div>

      <div class="actions">
        <button @click="$emit('close')" class="btn-cancel">Cancelar</button>
        <button @click="salvar" class="btn-save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.modal-overlay { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    background: rgba(0,0,0,0.5); 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    z-index: 999; 
}

.modal-content { 
    background: white; 
    padding: 25px; 
    border-radius: 12px; 
    width: 350px; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
}

.modal-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; margin-bottom: 20px; 
}

.modal-header h3 { 
    margin: 0; 
    color: #333; 
}

.btn-close { 
    background: none;
    border: none; 
    font-size: 1.2rem; 
    cursor: pointer; 
    color: #666; 
}

.form-group { 
    margin-bottom: 15px; 
    display: flex; 
    flex-direction: column; 
}

.form-group label { 
    font-size: 0.9rem; 
    font-weight: 600; 
    color: #444; 
    margin-bottom: 5px; 
}

input, select { 
    padding: 10px; 
    border: 1px solid #ddd; 
    border-radius: 6px; 
    font-size: 1rem; 
}

.actions { 
    display: flex; 
    justify-content: flex-end; 
    gap: 10px; 
    margin-top: 25px; 
}

.btn-save { 
    background: #2563eb; 
    color: white; 
    border: none; 
    padding: 10px 20px; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 600; 
}

.btn-save:hover { 
    background: #1d4ed8; 
}

.btn-cancel { 
    background: #e2e8f0; 
    color: #475569; 
    border: none; 
    padding: 10px 20px; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 600;
}

.btn-cancel:hover { 
    background: #cbd5e1; 
}

</style>
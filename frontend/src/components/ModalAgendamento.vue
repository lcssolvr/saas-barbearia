<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close', 'save']);

const form = ref({
  cliente_nome: '',
  data_hora: '',
  servicos_id: ''
});

const listaServicos = ref([])

onMounted(async () => {
  try {
    const response = await api.get('/servicos');
    listaServicos.value = response.data;
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
  }
});

const salvar = () => {
  if(!form.value.servico_id) {
    alert("Selecione um serviço!");
    return;
  }

  emit('save', { ...form.value });
  form.value.cliente_nome = '';
  form.value.data_hora = '';
  form.value.servico_id = '';
};
</script>

<template>
<div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h3>Novo Agendamento</h3>
      
      <div class="form-group">
        <label>Nome do Cliente:</label>
        <input v-model="form.cliente_nome" type="text" placeholder="Ex: Lucas Oliveira" />
      </div>

      <div class="form-group">
        <label>Serviço:</label>
        <select v-model="form.servico_id">
          <option disabled value="">Selecione...</option>
          <option v-for="servico in listaServicos" :key="servico.id" :value="servico.id">
            {{ servico.nome }} - R$ {{ servico.preco }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Data e Hora:</label>
        <input v-model="form.data_hora" type="datetime-local" />
      </div>

      <div class="actions">
        <button @click="$emit('close')" class="btn-cancel">Cancelar</button>
        <button @click="salvar" class="btn-save">Salvar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

select { 
    padding: 8px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    margin-top: 5px; 
    background: white; 
}

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
}

.modal-content { background: white; 
    padding: 20px; 
    border-radius: 8px; 
    width: 300px; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
}

.form-group { margin-bottom: 15px; 
    display: flex; 
    flex-direction: column; 
}

input { 
    padding: 8px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    margin-top: 5px; 
}

.actions { 
    display: flex; 
    justify-content: flex-end; 
    gap: 10px; 
    margin-top: 20px; 
}

.btn-save { 
    background: #27ae60; 
    color: white; 
    border: none; 
    padding: 8px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
}

.btn-cancel { 
    background: #ccc; 
    border: none; 
    padding: 8px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
}

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
}

.modal-content { 
    background: white; 
    padding: 20px; 
    border-radius: 8px; 
    width: 300px; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
}

.form-group { 
    margin-bottom: 15px; 
    display: flex; 
    flex-direction: column; 
}

input { 
    padding: 8px; 
    border: 1px solid #ccc; 
    border-radius: 4px; 
    margin-top: 5px; 
}

.actions { 
    display: flex; 
    justify-content: flex-end; 
    gap: 10px;
    margin-top: 20px; 
}

.btn-save { 
    background: #27ae60; 
    color: white; 
    border: none; 
    padding: 8px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
}

.btn-cancel { 
    background: #ccc; 
    border: none; 
    padding: 8px 15px; 
    border-radius: 4px; 
    cursor: pointer; 
}

</style>
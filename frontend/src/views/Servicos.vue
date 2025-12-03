<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const servicos = ref([]);
const loading = ref(true);

const novoServico = ref({
  nome: '',
  preco: '',
  duracao_minutos: 30
});

const fetchServicos = async () => {
  loading.value = true;
  try {
    const response = await api.get('/servicos');
    servicos.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const adicionarServico = async () => {
  if (!novoServico.value.nome || !novoServico.value.preco) {
    return alert("Preencha nome e preço!");
  }

  try {
    await api.post('/servicos', novoServico.value);
    alert("Serviço adicionado!");

    novoServico.value = { nome: '', preco: '', duracao_minutos: 30 };
    fetchServicos();
  } catch (error) {
    alert("Erro: " + error.message);
  }
};

const deletarServico = async (id) => {
  if (!confirm("Tem certeza? Isso não apagará agendamentos passados.")) return;
  
  try {
    await api.delete(`/servicos/${id}`);
    servicos.value = servicos.value.filter(s => s.id !== id);
  } catch (error) {
    alert("Erro ao deletar: " + error.message);
  }
};

onMounted(() => fetchServicos());
</script>

<template>
  <div class="container">
    <header>
      <h2>Gerenciar Serviços</h2>
      <button @click="router.push('/dashboard')" class="btn-voltar">← Voltar para Agenda</button>
    </header>

    <div class="card-form">
      <h3>Adicionar Novo</h3>
      <div class="form-row">
        <input v-model="novoServico.nome" type="text" placeholder="Nome (ex: Pezinho)" />
        <input v-model="novoServico.preco" type="number" placeholder="Preço (R$)" />
        <button @click="adicionarServico" class="btn-add">Salvar</button>
      </div>
    </div>

    <h3>Seus Serviços Atuais</h3>
    <div v-if="loading">Carregando...</div>
    
    <ul v-else class="lista">
      <li v-for="item in servicos" :key="item.id" class="item-servico">
        <div class="info">
          <strong>{{ item.nome }}</strong>
          <span>R$ {{ item.preco }}</span>
        </div>
        <button @click="deletarServico(item.id)" class="btn-delete">Excluir</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.container { padding: 20px; max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;}

.btn-voltar { background: transparent; border: 1px solid #ccc; padding: 5px 10px; cursor: pointer; border-radius: 4px; }
.btn-voltar:hover { background: #f0f0f0; }

.card-form { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
.card-form h3 { margin-top: 0; color: #475569; font-size: 1rem; }
.form-row { display: flex; gap: 10px; }
input { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
.btn-add { background: #10b981; color: white; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-add:hover { background: #059669; }

.lista { list-style: none; padding: 0; }
.item-servico { display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
.info { display: flex; flex-direction: column; }
.info strong { font-size: 1.1rem; }
.info span { color: #10b981; font-weight: bold; }

.btn-delete { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.btn-delete:hover { background: #ef4444; color: white; }
</style>
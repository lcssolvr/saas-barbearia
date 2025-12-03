<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import api from './services/api';

const auth = useAuthStore();
const email = ref('');
const password = ref('');
const agendamentos = ref([]);

const handleLogin = async () => {
  try {
    await auth.login(email.value, password.value);
    alert('Logado!');
    carregarAgenda();
  } catch (error) {
    alert('Erro: ' + error.message);
  }
};

const carregarAgenda = async () => {
  try {
    const response = await api.get('/agendamentos');
    agendamentos.value = response.data;
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div v-if="!auth.user">
    <h1>Login Barbearia</h1>
    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Senha" />
    <button @click="handleLogin">Entrar</button>
  </div>

  <div v-else>
    <h1>Bem vindo!</h1>
    <button @click="carregarAgenda">Atualizar Agenda</button>
    
    <ul>
      <li v-for="item in agendamentos" :key="item.id">
        {{ item.cliente_nome }} - {{ item.data_hora }}
      </li>
    </ul>
  </div>
</template>
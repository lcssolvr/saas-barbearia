# ✂️ NaRégua (Multi-Tenant)

Bem-vindo ao sistema de gestão SaaS para Barbearias!
Este projeto é uma plataforma completa que conecta donos de barbearia, barbeiros e clientes em um único ecossistema.

## 🚀 Funcionalidades

### 🏢 Para Donos (Tenants)
- **Dashboard Gerencial**: Visão macro do negócio com KPIs (Faturamento, Ocupação, Ticket Médio).
- **Gráficos Interativos**: Acompanhamento de receita semanal e distribuição de serviços.
- **Gestão de Serviços**: Criar, editar e remover serviços oferecidos (ex: Corte, Barba).
- **Gestão de Barbeiros**: Cadastrar e monitorar a equipe.

### ✂️ Para Barbeiros
- **Agenda Pessoal**: Visualização clara dos agendamentos do dia.
- **Gestão de Disponibilidade**: Adicionar horários livres para agendamento online.
- **Minha Carteira**: Acompanhamento dos ganhos pessoais.

### 👤 Para Clientes
- **Agendamento Online**: Link público para agendar horários com barbeiros específicos.
- **Histórico**: Visualizar cortes passados.
- **Cartão Fidelidade**: Programa de recompensas digital (ex: a cada 10 cortes, ganha 1).

### 🛡️ Para Super Admin
- **Gestão de Tenants**: Visualizar todas as barbearias cadastradas.
- **Controle de Acesso**: Bloquear/Ativar barbearias e alterar planos (Free/Pro).

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Vue.js 3 (Composition API), Vite, Pinia (State Management), Vue Router.
- **Charts**: Chart.js, Vue-Chartjs.
- **Backend**: Node.js, Express.js.
- **Banco de Dados/Auth**: Supabase (PostgreSQL).
- **Estilização**: CSS Puro (Scoped + Global).

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v16+)
- Conta no Supabase (com URL e Key)

### 1. Backend
```bash
cd backend
npm install
# Crie um arquivo .env com:
# SUPABASE_URL=sua_url
# SUPABASE_KEY=sua_chave_service_role
# PORT=3000
node app.js
```

### 2. Frontend
```bash
cd frontend
npm install
# Crie um arquivo .env com:
# VITE_API_URL=http://localhost:3000/api
npm run dev
```

## 📂 Estrutura do Projeto

```
/backend
  /config       # Configuração do Supabase
  /middlewares  # Autenticação e validação
  app.js        # Entry point e rotas da API

/frontend
  /src
    /components
      /dashboard # Componentes específicos de cada perfil (Dono, Admin, Barbeiro)
    /views       # Páginas principais (Login, Dashboard, Register)
    /stores      # Gerenciamento de estado (Pinia)
    /services    # Configuração do Axios
```

## 📝 Licença
Este projeto foi desenvolvido como um MVP de SaaS para agendamentos.

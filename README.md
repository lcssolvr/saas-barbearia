# 💈 NaRégua (Multi-Tenant)

Bem-vindo ao sistema de gestão SaaS para Barbearias!
Este projeto é uma plataforma completa que conecta donos de barbearia, barbeiros e clientes em um único ecossistema.

## Funcionalidades

### Landing Page
- **Apresentação**: Página inicial moderna com apresentação do projeto.
- **Navegação**: Acesso fácil ao Login e futuramente ao Mapa de Barbearias.

### Para Donos (Tenants)
- **Dashboard Gerencial**: Visão macro do negócio com KPIs (Faturamento, Ocupação, Ticket Médio).
- **Gráficos Interativos**: Acompanhamento de receita semanal e distribuição de serviços.
- **Gestão de Serviços**: Criar, editar e remover serviços oferecidos (ex: Corte, Barba).
- **Gestão de Barbeiros**: Cadastrar e monitorar a equipe.

### Para Barbeiros
- **Agenda Pessoal**: Visualização clara dos agendamentos do dia.
- **Auto-Refresh**: Atualização automática da agenda em tempo real.
- **Comissão**: Visualização da comissão estimada (50%).
- **Gestão de Disponibilidade**: Adicionar horários livres para agendamento online.

### Para Clientes
- **Dashboard Exclusivo**: Visão geral de agendamentos futuros e passados.
- **Cartão Fidelidade**: Programa de pontos integrado (ex: a cada 10 cortes, ganha 1).
- **Histórico**: Acesso rápido ao histórico de cortes em diferentes barbearias.
- **Agendamento Online**: Link público para agendar horários, com seleção de barbeiro.
- **Multi-Barbearia**: Suporte para o cliente agendar em diversas unidades diferentes e manter o histórico unificado.

## Tecnologias Utilizadas

- **Frontend**: Vue.js 3 (Composition API), Vite, Pinia (State Management), Vue Router.
- **Charts**: Chart.js, Vue-Chartjs.
- **Backend**: Node.js, Express.js (MVC Pattern).
- **Banco de Dados/Auth**: Supabase (PostgreSQL).
- **Estilização**: CSS Puro (Scoped + Global + Responsivo).

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

### Backend (MVC)
```
/backend
  /config       # Configuração do Supabase
  /controllers  # Lógica de negócios (Auth, Public, User, Agendamento...)
  /routes       # Definição das rotas da API
  /middlewares  # Autenticação e validação
  /utils        # Funções utilitárias (Slug...)
  app.js        # Entry point (apenas inicialização)
```

### Frontend
```
/frontend
  /src
    /components
      /dashboard # Componentes específicos de cada perfil
    /views       # Páginas principais (Home, Login, Dashboard, Register)
    /stores      # Gerenciamento de estado (Pinia)
    /services    # Configuração do Axios
    /router      # Configuração de rotas
```

## 📝 Licença
Este projeto foi desenvolvido como um MVP de SaaS para agendamentos.

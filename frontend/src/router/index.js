import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Servicos from '../views/Servicos.vue';
import Register from '../views/Register.vue';

import AgendamentoPublico from '../views/AgendamentoPublico.vue';
import AuthCallback from '../views/AuthCallback.vue';

const routes = [
  {
    path: '/',
    component: Login,
    name: 'Login'
  },
  {
    path: '/cadastro',
    component: Register,
    name: 'Register'
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'Dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/servicos',
    component: Servicos,
    name: 'Servicos',
    meta: { requiresAuth: true }
  },

  {
    path: '/agendar/:slug',
    component: AgendamentoPublico,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/callback',
    component: AuthCallback,
    name: 'AuthCallback'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('barber_token');
  const userType = localStorage.getItem('user_type');
  if (to.meta.requiresAuth && !token) {
    return next({ path: '/', query: { redirect: to.fullPath } });
  }


  next();
});

export default router;
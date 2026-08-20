import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import DashboardExecutivo from '../views/DashboardExecutivo.vue'
import AnaliseTemporalView from '../views/AnaliseTemporalView.vue'
import AnomaliasView from '../views/AnomaliasView.vue'
import MapeamentoView from '../views/MapeamentoView.vue'
import ExportarView from '../views/ExportarView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import WelcomePage from '../views/WelcomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },

    { path: '/welcome', name: 'Welcome', component: WelcomePage },
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },

    { path: '/home', name: 'Home', component: HomeView },
    { path: '/dashboard', name: 'Dashboard', component: DashboardExecutivo },
    { path: '/temporal', name: 'Temporal', component: AnaliseTemporalView },
    { path: '/anomalias', name: 'Anomalias', component: AnomaliasView },
    { path: '/mapa', name: 'Mapeamento', component: MapeamentoView },
    { path: '/exportar', name: 'Exportar', component: ExportarView }
  ]
})

export default router
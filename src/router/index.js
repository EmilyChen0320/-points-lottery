import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '../views/LoadingView.vue'
import HomeView from '../views/HomeView.vue'
import EarnSuccessView from '../views/EarnSuccessView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/loading', name: 'loading', component: LoadingView },
    { path: '/', name: 'home', component: HomeView },
    { path: '/earn-success', name: 'earn-success', component: EarnSuccessView },
  ],
})

export default router

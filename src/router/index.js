import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '../views/LoadingView.vue'
import HomeView from '../views/HomeView.vue'
import EarnSuccessView from '../views/EarnSuccessView.vue'
import RedeemHomeView from '../views/RedeemHomeView.vue'
import RedeemCouponView from '../views/RedeemCouponView.vue'
import RedeemDrawTicketView from '../views/RedeemDrawTicketView.vue'
import LuckyWheelView from '../views/LuckyWheelView.vue'
import MyDrawTicketsView from '../views/MyDrawTicketsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/loading', name: 'loading', component: LoadingView },
    { path: '/', name: 'home', component: HomeView },
    { path: '/redeem', name: 'redeem-home', component: RedeemHomeView },
    { path: '/redeem/coupon', name: 'redeem-coupon', component: RedeemCouponView },
    { path: '/redeem/draw-ticket', name: 'redeem-draw-ticket', component: RedeemDrawTicketView },
    { path: '/redeem/my-draw-tickets', name: 'my-draw-tickets', component: MyDrawTicketsView },
    { path: '/redeem/lucky-wheel', name: 'redeem-lucky-wheel', component: LuckyWheelView },
    { path: '/earn-success', name: 'earn-success', component: EarnSuccessView },
  ],
})

export default router

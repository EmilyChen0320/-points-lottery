import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '../views/LoadingView.vue'
import HomeView from '../views/HomeView.vue'
import EarnSuccessView from '../views/EarnSuccessView.vue'
import RedeemHomeView from '../views/RedeemHomeView.vue'
import RedeemCouponView from '../views/RedeemCouponView.vue'
import RedeemDrawTicketView from '../views/RedeemDrawTicketView.vue'
import LuckyWheelView from '../views/LuckyWheelView.vue'
import MyDrawTicketsView from '../views/MyDrawTicketsView.vue'
import CheckInPage from '../views/CheckInPage.vue'
import CheckInResultPage from '../views/CheckInResultPage.vue'

const router = createRouter({
  history: createWebHistory('/liff/point_activity/'),
  routes: [
    { path: '/loading', name: 'loading', component: LoadingView },
    { path: '/', name: 'home', component: HomeView },
    { path: '/redeem/:activityId', name: 'redeem-home', component: RedeemHomeView },
    { path: '/redeem/:activityId/coupon/:couponId', name: 'redeem-coupon', component: RedeemCouponView },
    { path: '/redeem/:activityId/draw-ticket/:lotteryId', name: 'redeem-draw-ticket', component: RedeemDrawTicketView },
    { path: '/redeem/:activityId/draw-ticket/:lotteryId/tickets', name: 'my-draw-tickets', component: MyDrawTicketsView },
    { path: '/redeem/:activityId/lucky-wheel/:lotteryId', name: 'redeem-lucky-wheel', component: LuckyWheelView },
    { path: '/check-in/:activityId', name: 'check-in', component: CheckInPage },
    { path: '/check-in/:activityId/result', name: 'check-in-result', component: CheckInResultPage },
    { path: '/earn-success', name: 'earn-success', component: EarnSuccessView },
  ],
})

export default router

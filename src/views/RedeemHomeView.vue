<script setup>
import { useRouter } from 'vue-router'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'

const router = useRouter()

const couponRewards = [
  {
    id: 'coupon-1',
    title: '母親節 85 折優惠券',
    remain: '剩餘 358 張',
    desc: '全館商品85折',
    cost: '100 點',
    buttonText: '去兌換',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80',
  },
  {
    id: 'coupon-2',
    title: '滿千折百',
    remain: '剩餘 300 張',
    desc: '消費滿1000折100',
    cost: '200 點',
    buttonText: '去兌換',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=200&q=80',
  },
]

const drawRewards = [
  {
    id: 'draw-1',
    title: '幸運大轉盤',
    remain: '今日剩餘 2 次',
    desc: '即時抽獎',
    cost: '30 點 / 次',
    buttonText: '去抽獎',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=200&q=80',
  },
  {
    id: 'draw-2',
    title: '年中大抽獎',
    remain: '我的抽獎券：3 張',
    desc: '統一開獎',
    cost: '50 點 / 張',
    extra: '開獎：05/01 20:00',
    buttonText: '兌換抽獎券',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&q=80',
  },
]

const goToRedeemCouponPage = () => {
  router.push('/redeem/coupon')
}

const goToDrawTicketPage = (item) => {
  if (item.buttonText === '兌換抽獎券') {
    router.push('/redeem/draw-ticket')
  }
  if (item.buttonText === '去抽獎') {
    router.push('/redeem/lucky-wheel')
  }
}
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="兌換獎勵" />

    <section class="relative h-[196px] overflow-hidden bg-[#6d4f78]">
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/45"></div>
      <div class="relative flex h-full flex-col justify-end px-4 pb-3 text-white">
        <p class="text-xs font-semibold tracking-[0.08em]">MOTHER'S DAY</p>
        <h1 class="mt-1 text-[20px] font-bold leading-7">母親節集點送好禮</h1>
        <p class="mt-1 text-xs">2026-04-01 ~ 06-30</p>
      </div>
    </section>

    <section class="bg-white">
      <div
        class="p-4"
        :style="{
          background:
            'linear-gradient(90deg, rgba(166, 96, 163, 0.05) 0%, rgba(166, 96, 163, 0.05) 100%), linear-gradient(90deg, #fff 0%, #fff 100%)',
        }"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold leading-4 text-[#A660A3]">母親節集點送好禮</p>
            <p class="mt-2 text-xs text-[#757575]">我的點數</p>
            <p class="mt-1 text-[#A660A3]">
              <span class="text-[26px] font-bold leading-5">350</span>
              <span class="ml-1 text-xs font-medium">點</span>
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-7 items-center justify-center rounded-[8px] border border-[#A660A3] px-3 text-xs font-semibold leading-5 text-[#A660A3]"
          >
            兌換紀錄
          </button>
        </div>
      </div>
    </section>

    <section class="bg-white px-4 pb-4 pt-3 shadow-[0_0_1px_0_rgba(0,0,0,0.05)]">
      <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">優惠券</h2>
      <div class="space-y-[11px]">
        <article
          v-for="item in couponRewards"
          :key="item.id"
          class="rounded-lg border border-[#A660A3] bg-white pl-3 pr-4 py-3 shadow-[0_0_1px_0_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <div class="flex items-start gap-3">
            <img :src="item.image" :alt="item.title" class="h-[65px] w-[65px] rounded-[8px] object-cover" />
            <div class="min-w-0 flex-1">
              <p class="min-w-0 truncate text-[14px] font-medium leading-5 text-[#495057]">
                {{ item.title }}
              </p>
              <p class="mt-2 text-xs font-normal leading-4 text-[#757575]">{{ item.desc }}</p>
              <p class="mt-1 text-[14px] font-medium leading-5 text-[#A660A3]">{{ item.cost }}</p>
            </div>
            <div class="flex self-stretch flex-col items-end justify-between text-right">
              <p class="text-right text-[12px] font-normal leading-4 text-[#757575]">{{ item.remain }}</p>
              <button
                type="button"
                class="h-7 rounded-[8px] bg-[#A660A3] px-3 py-1 text-xs font-semibold leading-5 text-white"
                @click="goToRedeemCouponPage"
              >
                {{ item.buttonText }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="mt-3 bg-white px-4 pb-6 pt-3 shadow-[0_0_1px_0_rgba(0,0,0,0.05)]">
      <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">抽獎</h2>
      <div class="space-y-[11px]">
        <article
          v-for="item in drawRewards"
          :key="item.id"
          class="rounded-lg border border-[#F49F25] bg-white pl-3 pr-4 py-3 shadow-[0_0_1px_0_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <div class="flex items-start gap-3">
            <img :src="item.image" :alt="item.title" class="h-[65px] w-[65px] rounded-[8px] object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[14px] font-medium leading-5 text-[#495057]">{{ item.title }}</p>
              <p class="mt-2 text-xs font-normal leading-4 text-[#757575]">{{ item.desc }}</p>
              <p class="mt-1 text-[14px] font-medium leading-5 text-[#F49F25]">{{ item.cost }}</p>
              <p v-if="item.extra" class="mt-0.5 text-[10px] leading-4 text-[#F49F25]">{{ item.extra }}</p>
            </div>
            <div class="flex self-stretch flex-col items-end justify-between text-right">
              <p class="text-right text-[12px] font-normal leading-4 text-[#757575]">{{ item.remain }}</p>
              <button
                type="button"
                class="h-7 rounded-[8px] bg-[#F49F25] px-3 py-1 text-xs font-semibold leading-5 text-white"
                @click="goToDrawTicketPage(item)"
              >
                {{ item.buttonText }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import barcodeScanImage from '../assets/images/barcode-scan.png'

const router = useRouter()
const route = useRoute()

const redeemStatus = ref(route.query.status === 'fail' ? 'fail' : route.query.status === 'success' ? 'success' : 'idle')
const costPoints = 50
const currentPoints = ref(350)
const fallbackPoints = 20
const currentTicketCount = ref(3)
const hasEnoughPoints = computed(() => currentPoints.value >= costPoints)

const statusTitle = computed(() => (redeemStatus.value === 'success' ? '抽獎券取得成功' : '兌換失敗'))
const statusChipText = computed(() =>
  redeemStatus.value === 'success'
    ? `已扣除 ${costPoints} 點，剩餘 ${currentPoints.value} 點`
    : `點數不足：需要 ${costPoints} 點，目前 ${fallbackPoints} 點`,
)

const handleRedeemTicket = () => {
  if (!hasEnoughPoints.value) {
    redeemStatus.value = 'fail'
    return
  }
  currentPoints.value -= costPoints
  currentTicketCount.value += 1
  redeemStatus.value = 'success'
}

const backToRedeemHome = () => {
  router.push('/redeem')
}

const goToMyDrawTickets = () => {
  router.push({ name: 'my-draw-tickets' })
}
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="redeemStatus === 'idle' ? '年中大抽獎' : '兌換結果'" />

    <template v-if="redeemStatus === 'idle'">
      <section class="px-4 pb-6 pt-[132px]">
        <article
          class="rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <p class="text-xs text-[#495057]">我的點數</p>
          <p class="mt-1 text-[#A660A3]">
            <span class="text-[20px] font-bold leading-6">350</span>
            <span class="ml-1 text-xs">點</span>
          </p>

          <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs text-[#495057]">每張所需：50 點</p>
                <p class="mt-1 text-xs font-medium text-[#A660A3]">我的抽獎券：{{ currentTicketCount }} 張</p>
              </div>
              <p class="text-xs text-[#495057]">今日剩餘：2 張</p>
            </div>
          </div>

          <p class="mt-3 text-xs font-bold text-[#009734]">開獎時間：2026-05-01 20:00</p>
          <p class="mt-1 text-xs text-[#757575]">距離開獎 22 天</p>
        </article>

        <section class="mt-10 space-y-4">
          <button
            type="button"
            class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
            @click="handleRedeemTicket"
          >
            兌換抽獎券（消耗 50 點）
          </button>
          <button
            type="button"
            class="w-full rounded-md border border-[#A7A7A7] bg-[#F4F4F5] py-3 text-[17px] font-bold text-[#919399]"
            @click="goToMyDrawTickets"
          >
            查看我的抽獎券
          </button>
        </section>
      </section>
    </template>

    <section v-else class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <div class="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-white text-xl font-bold text-white">
          {{ redeemStatus === 'success' ? '✓' : '✕' }}
        </div>
        <h1 class="mt-3 text-[20px] font-bold text-white">{{ statusTitle }}</h1>
        <p
          class="mt-2 inline-flex items-center justify-center rounded-[24px] bg-[#A660A3] px-8 py-2 text-[14px] font-medium leading-6 text-white border border-[#fffff]"
        >
          {{ statusChipText }}
        </p>
      </div>

      <article
        v-if="redeemStatus === 'success'"
        class="mt-10 rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
        style="border-width: 0.6px"
      >
        <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">抽獎券編號</h2>
        <p class="mt-2 text-[20px] font-bold tracking-[0.03em] text-[#A660A3]">A-0004</p>

        <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
          <p class="text-xs text-[#495057]">目前持有：{{ currentTicketCount }} 張</p>
          <p class="mt-1 text-xs text-[#A660A3]">開獎：05/01 20:00</p>
        </div>
      </article>

      <article
        v-else
        class="relative mt-10 h-[100px] overflow-hidden rounded-md bg-white px-4 py-3 shadow-[0_0_4px_rgba(0,0,0,0.12)]"
      >
        <h2 class="text-[17px] font-bold leading-5 text-[#495057]">如何獲得更多點數？</h2>
        <p class="mt-2 w-[220px] text-[14px] leading-4 text-[#757575]">
          前往合作店家掃描 QR Code 即可集點
        </p>
        <img
          :src="barcodeScanImage"
          alt="barcode scan decoration"
          class="pointer-events-none absolute -bottom-1 right-1 h-[98px] w-[98px] translate-y-[1px] -rotate-[-1deg] object-contain"
        />
      </article>

      <section class="mt-10 space-y-4">
        <button
          v-if="redeemStatus === 'success'"
          type="button"
          class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
          @click="handleRedeemTicket"
        >
          再兌換一張
        </button>
        <button
          v-if="redeemStatus === 'success'"
          type="button"
          class="w-full rounded-md border border-[#A7A7A7] bg-[#F4F4F5] py-3 text-[17px] font-bold text-[#919399]"
          @click="goToMyDrawTickets"
        >
          查看我的抽獎券
        </button>

        <button
          v-if="redeemStatus === 'fail'"
          type="button"
          class="w-full rounded-md bg-[#E8E8E8] py-3 text-[17px] font-bold text-[#757575]"
          @click="backToRedeemHome"
        >
          返回兌換首頁
        </button>
      </section>
    </section>
  </main>
</template>

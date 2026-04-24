<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import barcodeScanImage from '../assets/images/barcode-scan.png'

const router = useRouter()
const route = useRoute()

const redeemStatus = ref(route.query.status === 'fail' ? 'fail' : route.query.status === 'success' ? 'success' : 'idle')
const costPoints = 100
const currentPoints = 350
const fallbackPoints = 50
const hasEnoughPoints = computed(() => currentPoints >= costPoints)

const statusTitle = computed(() => (redeemStatus.value === 'success' ? '兌換成功' : '兌換失敗'))
const statusChipText = computed(() =>
  redeemStatus.value === 'success'
    ? `已扣除 ${costPoints} 點，剩餘 ${currentPoints - costPoints} 點`
    : `點數不足：需要 ${costPoints} 點，目前 ${fallbackPoints} 點`,
)

const handleConfirmRedeem = () => {
  redeemStatus.value = hasEnoughPoints.value ? 'success' : 'fail'
}

const backToRedeemHome = () => {
  router.push('/redeem')
}
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-[#FAFAFA] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="redeemStatus === 'idle' ? '兌換優惠券' : '兌換結果'" />

    <template v-if="redeemStatus === 'idle'">
      <section class="relative h-[196px] overflow-hidden bg-[#6d4f78]">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/45"></div>
        <div class="relative flex h-full flex-col justify-end px-4 pb-3 text-white">
          <h1 class="text-[20px] font-bold leading-7">母親節集點送好禮</h1>
          <p class="mt-1 text-xs">2026-04-01 ~ 06-30</p>
        </div>
      </section>

      <section class="px-4 pb-6 pt-6">
        <article
          class="rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">母親節 85 折優惠券</h2>
          <p class="mt-1 text-xs leading-4 text-[#757575]">全館商品享 85 折優惠</p>

          <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
            <p class="text-xs text-[#757575]">所需點數</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <p class="text-[20px] font-bold leading-6 text-[#A660A3]">100 點</p>
              <p class="text-right text-xs text-[#A660A3]">有效期限：04/01 ~ 06/30</p>
            </div>
          </div>

          <p class="mt-3 text-xs text-[#757575]">剩餘：358 / 500 張 | 每人限 1 張</p>
          <p class="mt-1 text-xs font-medium text-[#009734]">我的點數：350 點（足夠）</p>
        </article>

        <div class="mt-10">
          <button
            type="button"
            class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
            @click="handleConfirmRedeem"
          >
            確認兌換（扣除 100 點）
          </button>

          <ol class="mt-3 space-y-1 text-xs leading-4 text-[#757575]">
            <li>1. 每人限兌換數量依優惠券設定</li>
            <li>2. 兌換後不可退還點數</li>
          </ol>
        </div>
      </section>
    </template>

    <section v-else class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <div
          class="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 text-xl font-bold"
          :class="redeemStatus === 'success' ? 'border-white text-white' : 'border-white text-white'"
        >
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
        <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">母親節 85 折優惠券</h2>
        <p class="mt-1 text-xs text-[#757575]">優惠碼</p>
        <div class="mt-2 rounded-md bg-[rgba(166,96,163,0.05)] p-3">
          <p class="text-[17px] font-bold tracking-[0.03em] text-[#A660A3]">MOM2026-A3F8K</p>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-md border border-[#A660A3] bg-white py-2 text-sm font-semibold text-[#A660A3]"
        >
          複製優惠碼
        </button>
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

      <button
        type="button"
        class="mt-10 w-full rounded-md bg-[#E8E8E8] py-3 text-[17px] font-bold text-[#757575]"
        @click="backToRedeemHome"
      >
        返回兌換首頁
      </button>
    </section>
  </main>
</template>

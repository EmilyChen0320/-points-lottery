<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import barcodeScanImage from '../assets/images/barcode-scan.png'
import pointActivityService from '../services/pointActivityService'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { userId, testMode } = storeToRefs(userStore)

const activityId = computed(() => String(route.params.activityId ?? ''))
const lotteryId = computed(() => String(route.params.lotteryId ?? ''))
const lineUserId = computed(() => {
  if (testMode.value) {
    return userId.value || window.endpoint?.lineUserId || window.endpoint?.testUserId || ''
  }
  return userId.value || ''
})

const loading = ref(true)
const redeeming = ref(false)
const errorMessage = ref('')
const redeemErrorMessage = ref('')
const redeemStatus = ref('idle')
const lottery = ref(null)
const currentPoints = ref(0)
const currentTicketCount = ref(0)
const remainingEntriesToday = ref(0)

const pointsRequired = computed(() => Number(lottery.value?.points_required ?? 0))
const hasEnoughPoints = computed(() => currentPoints.value >= pointsRequired.value)
const isUnlimitedDailyEntries = computed(() => Number(lottery.value?.daily_limit ?? 0) === -1)
const hasRemainingEntries = computed(
  () => isUnlimitedDailyEntries.value || remainingEntriesToday.value > 0,
)
const remainingEntriesTodayText = computed(() =>
  isUnlimitedDailyEntries.value ? '今日不限次數' : `今日剩餘：${remainingEntriesToday.value} 次`,
)
const redeemButtonDisabled = computed(
  () => redeeming.value || !hasEnoughPoints.value || !hasRemainingEntries.value,
)
const drawAtText = computed(() => formatDateTime(lottery.value?.draw_at))
const statusTitle = computed(() => (redeemStatus.value === 'success' ? '抽獎券取得成功' : '兌換失敗'))
const statusChipText = computed(() => {
  if (redeemStatus.value === 'success') {
    return `已扣除 ${pointsRequired.value} 點，剩餘 ${currentPoints.value} 點`
  }

  return redeemErrorMessage.value || '兌換抽獎券失敗，請稍後再試'
})

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const applyLotteryDetail = (data) => {
  lottery.value = data ?? null
  currentPoints.value = Number(data?.line_user?.points ?? 0)
  currentTicketCount.value = Number(data?.line_user?.total_ticket_count ?? 0)
  remainingEntriesToday.value = Number(data?.line_user?.remaining_entries_today ?? 0)
}

const fetchLotteryInfo = async () => {
  if (!activityId.value || !lotteryId.value) {
    errorMessage.value = '缺少活動或抽獎參數'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await pointActivityService.getLotteryInfo(activityId.value, lotteryId.value, {
      line_user_id: lineUserId.value,
    })

    applyLotteryDetail(response?.result?.data ?? null)
  } catch (error) {
    console.error('取得抽獎活動資訊失敗:', error)
    errorMessage.value = error?.message || '取得抽獎活動資訊失敗'
  } finally {
    loading.value = false
  }
}

const handleRedeemTicket = async () => {
  if (redeeming.value) return

  if (!lineUserId.value) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = '缺少 LINE 使用者資訊，請重新開啟頁面'
    return
  }

  if (!hasEnoughPoints.value) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = `點數不足：需要 ${pointsRequired.value} 點，目前 ${currentPoints.value} 點`
    return
  }

  if (!hasRemainingEntries.value) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = '今日兌換次數已用完'
    return
  }

  redeeming.value = true
  redeemErrorMessage.value = ''

  try {
    await pointActivityService.redeemLottery(activityId.value, {
      lotteryId: lotteryId.value,
      lineUserId: lineUserId.value,
    })

    const detailResponse = await pointActivityService.getLotteryInfo(activityId.value, lotteryId.value, {
      line_user_id: lineUserId.value,
    })
    applyLotteryDetail(detailResponse?.result?.data ?? null)
    redeemStatus.value = 'success'
  } catch (error) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = error?.message || '兌換抽獎券失敗，請稍後再試'
  } finally {
    redeeming.value = false
  }
}

const backToRedeemHome = () => {
  if (!activityId.value) {
    router.push('/')
    return
  }
  router.push({ name: 'redeem-home', params: { activityId: activityId.value } })
}

const goToMyDrawTickets = () => {
  router.push({
    name: 'my-draw-tickets',
    params: {
      activityId: activityId.value,
      lotteryId: lotteryId.value,
    },
  })
}

onMounted(fetchLotteryInfo)
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="redeemStatus === 'idle' ? (lottery?.name || '抽獎活動') : '兌換結果'" />

    <template v-if="loading">
      <section class="px-4 pt-6">
        <div class="rounded-lg bg-white px-4 py-10 text-center text-sm text-[#757575] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
          抽獎活動資料載入中...
        </div>
      </section>
    </template>

    <template v-else-if="errorMessage">
      <section class="px-4 pt-6">
        <div class="rounded-lg bg-[#fff4f4] px-4 py-10 text-center text-sm text-[#d35b5b] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
          {{ errorMessage }}
        </div>
      </section>
    </template>

    <template v-else-if="redeemStatus === 'idle'">
      <section class="px-4 pb-6 pt-[132px]">
        <article
          class="rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <p class="text-xs text-[#495057]">我的點數</p>
          <p class="mt-1 text-[#A660A3]">
            <span class="text-[20px] font-bold leading-6">{{ currentPoints }}</span>
            <span class="ml-1 text-xs">點</span>
          </p>

          <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs text-[#495057]">每張所需：{{ pointsRequired }} 點</p>
                <p class="mt-1 text-xs font-medium text-[#A660A3]">我的抽獎券：{{ currentTicketCount }} 張</p>
              </div>
              <p class="text-xs text-[#495057]">{{ remainingEntriesTodayText }}</p>
            </div>
          </div>

          <p class="mt-3 text-xs font-bold text-[#009734]">開獎時間：{{ drawAtText }}</p>
        </article>

        <section class="mt-10 space-y-4">
          <button
            type="button"
            class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="redeemButtonDisabled"
            @click="handleRedeemTicket"
          >
            {{ redeeming ? '兌換中...' : `兌換抽獎券（消耗 ${pointsRequired} 點）` }}
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
          class="mt-2 inline-flex items-center justify-center rounded-[24px] bg-[#A660A3] px-8 py-2 text-[14px] font-medium leading-6 text-white"
        >
          {{ statusChipText }}
        </p>
      </div>

      <article
        v-if="redeemStatus === 'success'"
        class="mt-10 rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
        style="border-width: 0.6px"
      >
        <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">抽獎券已更新</h2>
        <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
          <p class="text-xs text-[#495057]">目前持有：{{ currentTicketCount }} 張</p>
          <p class="mt-1 text-xs text-[#A660A3]">開獎：{{ drawAtText }}</p>
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

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import giftImage from '../assets/images/gift.png'
import pointActivityService from '../services/pointActivityService'
import { useUserStore } from '../stores/userStore'

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
const errorMessage = ref('')
const lotteryName = ref('')
const drawAt = ref('')
const tickets = ref([])
const prizeMap = ref({})
const now = ref(Date.now())

let countdownTimer = null

const pendingTickets = computed(() =>
  tickets.value.filter((ticket) => !ticket.drawn_at),
)

const drawnTickets = computed(() =>
  tickets.value
    .filter((ticket) => Boolean(ticket.drawn_at))
    .map((ticket) => {
      const prize = ticket.prize_id ? prizeMap.value[ticket.prize_id] : null
      const isConsolation = Boolean(prize?.is_consolation)
      return {
        id: ticket.id,
        ticketNo: ticket.ticket_no,
        prizeName: prize?.name || '銘謝惠顧',
        isConsolation,
      }
    }),
)

const totalTicketCount = computed(() => tickets.value.length)

const drawAtTimestamp = computed(() => {
  if (!drawAt.value) return 0
  const time = new Date(drawAt.value).getTime()
  return Number.isNaN(time) ? 0 : time
})

const isDrawn = computed(() => {
  if (!drawAtTimestamp.value) return false
  return now.value >= drawAtTimestamp.value
})

const countdown = computed(() => {
  const diff = Math.max(drawAtTimestamp.value - now.value, 0)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
  }
})

const fetchData = async () => {
  if (!activityId.value || !lotteryId.value) {
    errorMessage.value = '缺少活動或抽獎參數'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const [ticketsResponse, lotteryResponse] = await Promise.all([
      pointActivityService.getLotteryTickets(activityId.value, lotteryId.value, {
        line_user_id: lineUserId.value,
      }),
      pointActivityService.getLotteryInfo(activityId.value, lotteryId.value, {
        line_user_id: lineUserId.value,
      }),
    ])

    const ticketResult = ticketsResponse?.result ?? {}
    tickets.value = Array.isArray(ticketResult.data) ? ticketResult.data : []
    drawAt.value = ticketResult.draw_at || lotteryResponse?.result?.data?.draw_at || ''

    const lotteryData = lotteryResponse?.result?.data ?? {}
    lotteryName.value = lotteryData.name || '抽獎活動'

    const prizes = Array.isArray(lotteryData.prizes) ? lotteryData.prizes : []
    prizeMap.value = prizes.reduce((acc, prize) => {
      if (prize?.id) acc[prize.id] = prize
      return acc
    }, {})
  } catch (error) {
    console.error('取得抽獎券資料失敗:', error)
    errorMessage.value = error?.message || '取得抽獎券資料失敗'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
  countdownTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="我的抽獎券" />

    <template v-if="loading">
      <section class="px-4 pt-6">
        <div class="rounded-lg bg-white px-4 py-10 text-center text-sm text-[#757575] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
          抽獎券資料載入中...
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

    <template v-else>
      <section class="px-4 pb-0 pt-4 text-white">
        <div class="relative overflow-visible px-4 py-3">
          <div>
            <p class="text-[17px] font-bold">
              {{ isDrawn ? '已開獎 🎉' : '開獎倒數 🎊' }}
            </p>
            <div v-if="!isDrawn" class="mt-2 flex items-center gap-2">
              <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">
                {{ countdown.days }}
              </div>
              <span class="text-xs">天</span>
              <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">
                {{ countdown.hours }}
              </div>
              <span class="text-xs">小時</span>
              <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">
                {{ countdown.minutes }}
              </div>
              <span class="text-xs">分</span>
            </div>
            <p v-else class="mt-2 text-xs">獎項已揭曉，快查看下方結果</p>
          </div>
          <img
            :src="giftImage"
            alt="gift"
            class="pointer-events-none absolute right-1 -bottom-8 h-28 w-28 -translate-x-2 object-contain"
          />
        </div>
      </section>

      <section class="mt-4 rounded-t-[32px] bg-white px-4 pb-6 pt-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-[#495057]">{{ lotteryName }}</h2>
          <p class="text-xs text-[#757575]">持有 {{ totalTicketCount }} 張抽獎券</p>
        </div>

        <template v-if="totalTicketCount === 0">
          <div class="mt-4 rounded-lg bg-[#faf9fc] px-4 py-8 text-center text-sm text-[#757575]">
            尚未持有任何抽獎券
          </div>
        </template>

        <template v-else>
          <div v-if="pendingTickets.length > 0" class="mt-3 space-y-2">
            <article
              v-for="ticket in pendingTickets"
              :key="ticket.id"
              class="flex items-center justify-between rounded-md border border-[#E8E8E8] bg-white px-3 py-3"
              style="border-width:0.5px"
            >
              <div>
                <p class="text-sm font-medium text-[#495057]"># {{ ticket.ticket_no }}</p>
                <p class="text-xs text-[#757575]">待開獎</p>
              </div>
              <span class="rounded-sm bg-[rgba(166,96,163,0.06)] px-3 py-1 text-xs text-[#A660A3]">待開獎</span>
            </article>
          </div>

          <template v-if="drawnTickets.length > 0">
            <div class="mx-[-16px] my-4 border-y border-[#009734] bg-[#ECFAE8] py-2 text-center text-xs font-semibold text-[#009734]">
              已開獎票券 🎉
            </div>

            <div class="space-y-2">
              <article
                v-for="ticket in drawnTickets"
                :key="ticket.id"
                class="flex items-center justify-between rounded-md px-3 py-3"
                :class="
                  ticket.isConsolation
                    ? 'border border-[#E8E8E8] bg-[#F5F5F5]'
                    : 'border border-[#F49F25] bg-[#FFF8F1]'
                "
                style="border-width:0.5px"
              >
                <div>
                  <p class="text-sm font-medium text-[#495057]"># {{ ticket.ticketNo }}</p>
                  <p class="text-xs text-[#757575]">{{ ticket.prizeName }}</p>
                </div>
                <span
                  v-if="!ticket.isConsolation"
                  class="rounded-sm bg-[#F49F25] px-3 py-1 text-xs text-white"
                >
                  中獎
                </span>
              </article>
            </div>
          </template>
        </template>
      </section>
    </template>
  </main>
</template>

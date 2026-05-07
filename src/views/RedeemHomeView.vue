<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import pointActivityService from '../services/pointActivityService'

const router = useRouter()
const route = useRoute()

const activityId = computed(() => String(route.params.activityId ?? ''))
const lineUserId = computed(
  () => String(route.query.line_user_id ?? window.endpoint?.lineUserId ?? window.endpoint?.testUserId ?? ''),
)
const loading = ref(true)
const errorMessage = ref('')
const activity = ref(null)
const userPoints = ref(0)
const couponRewards = ref([])
const drawRewards = ref([])

const couponFallbackImages = [
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=80',
]

const drawFallbackImages = [
  'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=200&q=80',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&q=80',
]

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

const periodText = computed(() => {
  if (!activity.value) return '--'
  return `${formatDate(activity.value.start_at)} ~ ${formatDate(activity.value.end_at)}`
})

const heroStyle = computed(() => {
  if (activity.value?.cover_image) {
    return {
      backgroundImage: `url(${activity.value.cover_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return {
    backgroundColor: '#6d4f78',
  }
})

const mapCoupons = (coupons = []) =>
  coupons.map((item, index) => ({
    id: item.id,
    title: item.name || '未命名優惠券',
    remain: `剩餘 ${Number(item.remaining_sendable_qty ?? 0)} 張`,
    desc: item.description || item.instructions || '尚無優惠券說明',
    cost: `${Number(item.points_required ?? 0)} 點`,
    buttonText: '去兌換',
    image: couponFallbackImages[index % couponFallbackImages.length],
  }))

const mapLotteries = (lotteries = []) =>
  lotteries.map((item, index) => {
    const drawMode = item.draw_mode === 'scheduled' ? 'scheduled' : 'immediate'
    const lineUser = item.line_user ?? {}

    return {
      id: item.id,
      drawMode,
      title: item.name || '未命名抽獎',
      remain:
        drawMode === 'scheduled'
          ? `我的抽獎券：${Number(lineUser.total_ticket_count ?? 0)} 張`
          : `今日剩餘 ${Number(lineUser.remaining_entries_today ?? 0)} 次`,
      desc: drawMode === 'scheduled' ? '統一開獎' : '即時抽獎',
      cost: `${Number(item.points_required ?? 0)} 點 / ${drawMode === 'scheduled' ? '張' : '次'}`,
      extra: drawMode === 'scheduled' && item.draw_at ? `開獎：${formatDateTime(item.draw_at)}` : '',
      buttonText: drawMode === 'scheduled' ? '兌換抽獎券' : '去抽獎',
      image: drawFallbackImages[index % drawFallbackImages.length],
    }
  })

const fetchActivityDetail = async () => {
  if (!activityId.value) {
    errorMessage.value = '缺少活動 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await pointActivityService.getPointActivityDetail(activityId.value, {
      line_user_id: lineUserId.value,
    })
    const data = response?.result?.data ?? {}

    activity.value = data.activity ?? null
    userPoints.value = Number(data.line_user?.points ?? 0)
    couponRewards.value = mapCoupons(data.coupons ?? [])
    drawRewards.value = mapLotteries(data.lotteries ?? [])
  } catch (error) {
    console.error('取得集點活動詳情失敗:', error)
    errorMessage.value = error?.message || '取得活動資料失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const goToRedeemCouponPage = (couponId) => {
  if (!couponId) return
  router.push({
    name: 'redeem-coupon',
    params: {
      activityId: activityId.value,
      couponId,
    },
  })
}

const goToDrawTicketPage = (item) => {
  if (!item?.id) return

  router.push({
    name: item.drawMode === 'scheduled' ? 'redeem-draw-ticket' : 'redeem-lucky-wheel',
    params: {
      activityId: activityId.value,
      lotteryId: item.id,
    },
  })
}

onMounted(fetchActivityDetail)
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="兌換獎勵" />

    <div v-if="loading" class="px-4 pt-6">
      <div class="rounded-lg bg-white px-4 py-10 text-center text-sm text-[#757575] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
        活動資料載入中...
      </div>
    </div>

    <div v-else-if="errorMessage" class="px-4 pt-6">
      <div class="rounded-lg bg-[#fff4f4] px-4 py-10 text-center text-sm text-[#d35b5b] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
        {{ errorMessage }}
      </div>
    </div>

    <template v-else>
      <section class="relative h-[196px] overflow-hidden" :style="heroStyle">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/45"></div>
        <div class="relative flex h-full flex-col justify-end px-4 pb-3 text-white">
          <p class="text-xs font-semibold tracking-[0.08em]">POINT ACTIVITY</p>
          <h1 class="mt-1 text-[20px] font-bold leading-7">{{ activity?.name || '集點活動' }}</h1>
          <p class="mt-1 text-xs">{{ periodText }}</p>
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
              <p class="text-xs font-semibold leading-4 text-[#A660A3]">{{ activity?.name || '集點活動' }}</p>
              <p class="mt-2 text-xs text-[#757575]">我的點數</p>
              <p class="mt-1 text-[#A660A3]">
                <span class="text-[26px] font-bold leading-5">{{ userPoints }}</span>
                <span class="ml-1 text-xs font-medium">點</span>
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-7 items-center justify-center rounded-[8px] border border-[#A660A3] px-3 text-xs font-semibold leading-5 text-[#A660A3] opacity-50"
              disabled
            >
              兌換紀錄
            </button>
          </div>
        </div>
      </section>

      <section class="bg-white px-4 pb-4 pt-3 shadow-[0_0_1px_0_rgba(0,0,0,0.05)]">
        <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">優惠券</h2>
        <div v-if="couponRewards.length === 0" class="rounded-lg bg-[#faf9fc] px-4 py-8 text-center text-sm text-[#757575]">
          目前沒有可兌換的優惠券
        </div>
        <div v-else class="space-y-[11px]">
          <article
            v-for="item in couponRewards"
            :key="item.id"
            class="rounded-lg border border-[#A660A3] bg-white pl-3 pr-4 py-3 shadow-[0_0_1px_0_rgba(0,0,0,0.10)]"
            style="border-width: 0.6px"
          >
            <div class="flex items-center gap-3">
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
                  @click="goToRedeemCouponPage(item.id)"
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
        <div v-if="drawRewards.length === 0" class="rounded-lg bg-[#fffaf4] px-4 py-8 text-center text-sm text-[#9a7b48]">
          目前沒有可參與的抽獎活動
        </div>
        <div v-else class="space-y-[11px]">
          <article
            v-for="item in drawRewards"
            :key="item.id"
            class="rounded-lg border border-[#F49F25] bg-white pl-3 pr-4 py-3 shadow-[0_0_1px_0_rgba(0,0,0,0.10)]"
            style="border-width: 0.6px"
          >
            <div class="flex items-center gap-3">
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
    </template>
  </main>
</template>

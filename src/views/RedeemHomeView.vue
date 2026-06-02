<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/userStore'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import pointActivityService from '../services/pointActivityService'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { userId, testMode } = storeToRefs(userStore)

const activityId = computed(() => String(route.params.activityId ?? ''))
const lineUserId = computed(() => {
  if (testMode.value) {
    return userId.value || String(route.query.line_user_id ?? window.endpoint?.lineUserId ?? window.endpoint?.testUserId ?? '')
  }
  return userId.value || String(route.query.line_user_id ?? '')
})
const loading = ref(true)
const errorMessage = ref('')
const activity = ref(null)
const userPoints = ref(0)
const couponRewards = ref([])
const drawRewards = ref([])
const hasCheckInSpots = ref(false)

const parsePoints = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

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

const pickCouponImageUrl = (item = {}) => {
  const candidates = [item.style?.background_image, item.style?.backgroundImage]
  const hit = candidates.find((value) => typeof value === 'string' && value.trim())
  return hit ? hit.trim() : ''
}

const pickRewardImageUrl = (item = {}) => {
  const candidates = [
    item.image,
    item.image_url,
    item.cover_image,
    item.cover_url,
    item.thumbnail,
    item.style?.background_image,
    item.style?.backgroundImage,
  ]
  const hit = candidates.find((value) => typeof value === 'string' && value.trim())
  return hit ? hit.trim() : ''
}

const mapCoupons = (coupons = []) =>
  coupons.map((item) => ({
    id: item.id,
    title: item.name || '未命名優惠券',
    remain: formatCouponRemaining(item),
    desc: item.description || item.instructions || '尚無優惠券說明',
    cost: `${Number(item.points_required ?? 0)} 點`,
    buttonText: '去兌換',
    image: pickCouponImageUrl(item),
  }))

const isUnlimitedCouponTotal = (item = {}) => {
  const totalLimit = item.total_limit ?? item.coupon_total ?? item.total_quota ?? item.limit_qty
  return Number(totalLimit) === -1
}

const formatCouponRemaining = (item = {}) =>
  isUnlimitedCouponTotal(item)
    ? '剩餘 無限制'
    : `剩餘 ${Number(item.remaining_sendable_qty ?? 0)} 張`

const formatRemainingEntries = (item, lineUser = {}) =>
  Number(item?.daily_limit ?? 0) === -1
    ? '今日不限次數'
    : `今日剩餘 ${Number(lineUser.remaining_entries_today ?? 0)} 次`

const mapLotteries = (lotteries = []) =>
  lotteries.map((item) => {
    const drawMode = item.draw_mode === 'scheduled' ? 'scheduled' : 'immediate'
    const lineUser = item.line_user ?? {}

    return {
      id: item.id,
      drawMode,
      title: item.name || '未命名抽獎',
      remain:
        drawMode === 'scheduled'
          ? `我的抽獎券：${Number(lineUser.total_ticket_count ?? 0)} 張`
          : formatRemainingEntries(item, lineUser),
      desc: drawMode === 'scheduled' ? '統一開獎' : '即時抽獎',
      cost: `${Number(item.points_required ?? 0)} 點 / ${drawMode === 'scheduled' ? '張' : '次'}`,
      extra: drawMode === 'scheduled' && item.draw_at ? `開獎：${formatDateTime(item.draw_at)}` : '',
      buttonText: drawMode === 'scheduled' ? '兌換抽獎券' : '去抽獎',
      image: pickRewardImageUrl(item),
    }
  })

const checkInSummary = computed(() => {
  const source = activity.value?.checkin_summary ?? activity.value?.check_in_summary ?? activity.value?.checkin ?? {}
  const checkedCount = parsePoints(
    source.successful_checkin_count ??
      source.checked_in_count ??
      source.checkin_count ??
      activity.value?.successful_checkin_count,
  )

  return {
    title: source.title || `${activity.value?.name || '集點活動'} 打卡集點活動`,
    description: source.description || '打卡活動',
    checkedCount,
    image: pickRewardImageUrl(source) || activity.value?.cover_image || '',
  }
})

const rowsFromResponse = (response = {}) => {
  const result = response.result
  const data = result?.data ?? result
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getTotalFromResponse = (response = {}) => {
  const result = response.result
  const total = Number(result?.total ?? result?.data?.total)
  if (Number.isFinite(total)) return total
  return rowsFromResponse(response).length
}

const requestCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('請開啟定位權限'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    })
  })

const loadCheckInSpotsAvailability = async () => {
  hasCheckInSpots.value = false

  try {
    const position = await requestCurrentPosition()
    const response = await pointActivityService.getCheckinSpots(activityId.value, {
      line_user_id: lineUserId.value,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      per_page: 1,
    })
    hasCheckInSpots.value = getTotalFromResponse(response) > 0
  } catch (error) {
    console.error('取得打卡點列表失敗:', error)
    hasCheckInSpots.value = false
  }
}

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
    const pointsResponse = await pointActivityService.getLineUserPoints(activityId.value, {
      line_user_id: lineUserId.value,
    })

    activity.value = data.activity ?? null
    userPoints.value = parsePoints(pointsResponse?.result?.data?.points ?? data.line_user?.points)
    couponRewards.value = mapCoupons(data.coupons ?? [])
    drawRewards.value = mapLotteries(data.lotteries ?? [])
    await loadCheckInSpotsAvailability()
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

const goToCheckInPage = () => {
  router.push({
    name: 'check-in',
    params: {
      activityId: activityId.value,
    },
  })
}

onMounted(fetchActivityDetail)
watch(
  () => [route.params.activityId, lineUserId.value],
  fetchActivityDetail,
)
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
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold leading-4 text-[#A660A3]">{{ activity?.name || '集點活動' }}</p>
              <p class="mt-2 text-xs text-[#757575]">我的點數</p>
              <p class="mt-1 text-[#A660A3]">
                <span class="text-[26px] font-bold leading-5">{{ userPoints }}</span>
                <span class="ml-1 text-xs font-medium">點</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="hasCheckInSpots" class="bg-white px-4 pb-4 pt-3 shadow-[0_0_1px_0_rgba(0,0,0,0.05)]">
        <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">打卡集點</h2>
        <article
          class="rounded-lg bg-[#fbf7fb] px-3 py-3 shadow-[0_0_1px_0_rgba(0,0,0,0.08)]"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="checkInSummary.image"
              :src="checkInSummary.image"
              :alt="checkInSummary.title"
              class="h-[65px] w-[65px] rounded-[8px] object-cover"
            />
            <div
              v-else
              class="h-[65px] w-[65px] shrink-0 rounded-[8px] bg-[#f2edf4]"
              aria-hidden="true"
            ></div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[14px] font-medium leading-5 text-[#495057]">
                {{ checkInSummary.title }}
              </p>
              <p class="mt-1 text-xs leading-4 text-[#757575]">{{ checkInSummary.description }}</p>
              <p class="mt-2 text-[14px] font-medium leading-5 text-[#A660A3]">
                已獲得：{{ userPoints }} 點
              </p>
            </div>
            <div class="flex self-stretch flex-col items-end justify-between text-right">
              <p class="text-[12px] leading-4 text-[#757575]">已打卡 {{ checkInSummary.checkedCount }} 次</p>
              <button
                type="button"
                class="h-7 rounded-[8px] bg-[#A660A3] px-3 py-1 text-xs font-semibold leading-5 text-white"
                @click="goToCheckInPage"
              >
                去打卡
              </button>
            </div>
          </div>
        </article>
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
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="h-[65px] w-[65px] rounded-[8px] object-cover"
              />
              <div
                v-else
                class="h-[65px] w-[65px] shrink-0 rounded-[8px] bg-[#f2edf4]"
                aria-hidden="true"
              ></div>
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
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="h-[65px] w-[65px] rounded-[8px] object-cover"
              />
              <div
                v-else
                class="h-[65px] w-[65px] shrink-0 rounded-[8px] bg-[#fff3df]"
                aria-hidden="true"
              ></div>
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

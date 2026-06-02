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
const checkingInId = ref(null)
const errorMessage = ref('')
const locationMessage = ref('')
const activity = ref(null)
const userPoints = ref(0)
const userLocation = ref(null)
const checkinSpots = ref([])

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
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

const activityTitle = computed(() => activity.value?.name || '打卡集點活動')

const normalizeSpot = (item = {}) => {
  const distance = item.distance_meters ?? item.distance
  const successfulCount = toNumber(item.successful_checkin_count, 0)
  const checkedIn = Boolean(item.checked_in ?? item.is_checked_in ?? false)
  const isWithinRadius = Boolean(item.is_within_radius)
  const canCheckin =
    item.can_checkin == null ? isWithinRadius && !checkedIn : Boolean(item.can_checkin)

  return {
    ...item,
    id: item.id ?? item.checkin_spot_id ?? item.spot_id,
    name: item.name || '未命名打卡點',
    address: item.address || '',
    lat: toNumber(item.lat ?? item.latitude, null),
    lng: toNumber(item.lng ?? item.longitude, null),
    radius: toNumber(item.radius_meters ?? item.radius, 100),
    distance: distance == null ? null : Math.round(toNumber(distance, 0)),
    canCheckin,
    isWithinRadius,
    cannotReason: item.cannot_checkin_reason || '',
    checkedIn,
    hasSuccessfulCheckin: successfulCount > 0,
    successfulCount,
    nextAvailableTime: item.next_available_time || '',
  }
}

const rowsFromResponse = (response = {}) => {
  const result = response.result
  const data = result?.data ?? result
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const availableSpots = computed(() => checkinSpots.value)
const checkedInSpots = computed(() => checkinSpots.value.filter((item) => item.hasSuccessfulCheckin))

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

const loadUserLocation = async () => {
  locationMessage.value = ''

  try {
    const position = await requestCurrentPosition()
    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracyMeters: position.coords.accuracy ?? null,
    }
  } catch (error) {
    console.error('取得 GPS 失敗:', error)
    userLocation.value = null
    locationMessage.value = '請開啟定位權限'
  }
}

const loadActivityDetail = async () => {
  const response = await pointActivityService.getPointActivityDetail(activityId.value, {
    line_user_id: lineUserId.value,
  })
  activity.value = response?.result?.data?.activity ?? null
}

const loadUserPoints = async () => {
  const response = await pointActivityService.getLineUserPoints(activityId.value, {
    line_user_id: lineUserId.value,
  })
  userPoints.value = toNumber(response?.result?.data?.points, 0)
}

const loadCheckinSpots = async () => {
  if (!userLocation.value) return

  const response = await pointActivityService.getCheckinSpots(activityId.value, {
    line_user_id: lineUserId.value,
    lat: userLocation.value.lat,
    lng: userLocation.value.lng,
    per_page: 100,
  })
  checkinSpots.value = rowsFromResponse(response).map(normalizeSpot)
}

const refreshPage = async () => {
  if (!activityId.value) {
    errorMessage.value = '缺少活動 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loadActivityDetail()
    await loadUserPoints()
    await loadUserLocation()
    await loadCheckinSpots()
  } catch (error) {
    console.error('載入打卡頁失敗:', error)
    errorMessage.value = error?.message || '取得打卡資料失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const formatDistance = (distance) => {
  if (distance == null) return '定位中'
  if (distance < 1000) return `${distance} 公尺`
  return `${(distance / 1000).toFixed(1)} 公里`
}

const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

const getOutsideRadiusText = (spot) =>
  Number(spot?.radius) > 0 ? `需到 ${spot.radius} 公尺內` : '您目前不在打卡範圍內'

const getCannotCheckinReasonText = (spot) => {
  const reason = String(spot?.cannotReason || '')

  const reasonMap = {
    outside_radius: getOutsideRadiusText(spot),
    cooldown: '尚在重複打卡限制時間內',
    daily_limit: '已達今日打卡上限',
    total_limit: '已達活動打卡上限',
    per_user_per_source_limit: '已達此打卡點打卡上限',
    invalid_earn_rules: '目前無法打卡，請稍後再試',
  }

  if (reasonMap[reason]) {
    return reasonMap[reason]
  }

  if (reason.includes('_')) {
    return '目前無法打卡，請稍後再試'
  }

  return reason
}

const getSpotStatusText = (spot) => {
  if (spot.canCheckin) return ''
  const cannotReasonText = getCannotCheckinReasonText(spot)
  if (cannotReasonText) return cannotReasonText
  if (!spot.isWithinRadius) return getOutsideRadiusText(spot)
  return '暫時無法打卡'
}

const openMap = (spot) => {
  if (spot.lat == null || spot.lng == null) return
  window.open(`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`, '_blank')
}

const goResult = (query = {}) => {
  router.push({
    name: 'check-in-result',
    params: { activityId: activityId.value },
    query,
  })
}

const submitCheckIn = async (spot) => {
  if (!userLocation.value || checkingInId.value) return

  if (!spot.canCheckin) {
    goResult({
      status: spot.isWithinRadius ? 'failed' : 'out-of-range',
      distance: spot.distance ?? '',
      message: getSpotStatusText(spot) || '請靠近打卡點再試一次',
      next_available_time: spot.nextAvailableTime || '',
    })
    return
  }

  checkingInId.value = spot.id
  errorMessage.value = ''

  try {
    const response = await pointActivityService.submitCheckIn(activityId.value, {
      checkin_spot_id: spot.id,
      line_user_id: lineUserId.value,
      lat: userLocation.value.lat,
      lng: userLocation.value.lng,
      accuracy_meters: userLocation.value.accuracyMeters,
    })
    const result = response?.result ?? {}

    if (result.success === false) {
      goResult({
        status: 'failed',
        distance: spot.distance ?? '',
        message: result.message || response?.message || '打卡失敗',
      })
      return
    }

    goResult({
      status: 'success',
      points: result.earned_points ?? '',
      total: result.total_points ?? '',
      store: result.store_name ?? spot.name,
      message: result.message || '感謝您的參與',
    })
  } catch (error) {
    console.error('打卡失敗:', error)
    goResult({
      status: 'failed',
      distance: spot.distance ?? '',
      message: error?.message || '打卡失敗',
    })
  } finally {
    checkingInId.value = null
  }
}

onMounted(refreshPage)
watch(
  () => [route.params.activityId, lineUserId.value],
  refreshPage,
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
        打卡點載入中...
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
          <h1 class="mt-1 text-[20px] font-bold leading-7">{{ activityTitle }}</h1>
          <p class="mt-1 text-xs">{{ periodText }}</p>
        </div>
      </section>

      <section class="bg-white px-4 pb-4 pt-3">
        <div class="flex items-start justify-between border-b border-[#f0e7f1] pb-3">
          <div>
            <h2 class="text-sm font-semibold leading-5 text-[#A660A3]">打卡集點活動</h2>
            <p class="mt-1 text-xs leading-4 text-[#757575]">已獲得點數</p>
          </div>
          <p class="text-[#A660A3]">
            <span class="text-[26px] font-bold leading-7">{{ userPoints }}</span>
            <span class="ml-1 text-xs font-semibold">點</span>
          </p>
        </div>

        <div v-if="locationMessage" class="mt-3 rounded-lg bg-[#fff4f4] px-4 py-3 text-sm text-[#d35b5b]">
          {{ locationMessage }}
        </div>
      </section>

      <section class="bg-white px-4 pb-4 pt-3">
        <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">附近的打卡點</h2>

        <div v-if="availableSpots.length === 0" class="rounded-lg bg-[#f8f6fb] px-4 py-8 text-center text-sm text-[#757575]">
          目前沒有可打卡的地點
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="spot in availableSpots"
            :key="spot.id"
            class="rounded-lg p-4"
            :class="spot.canCheckin ? 'border border-[#A660A3] bg-white' : 'bg-[#f5f5f5]'"
          >
            <h3 class="text-[14px] font-semibold leading-5 text-[#495057]">{{ spot.name }}</h3>
            <p class="mt-1 text-xs leading-4 text-[#757575]">{{ spot.address || '未提供地址' }}</p>
            <p class="mt-1 text-xs leading-4 text-[#A660A3]">● 距離 {{ formatDistance(spot.distance) }}</p>
            <p v-if="spot.hasSuccessfulCheckin" class="mt-1 text-xs leading-4 text-[#757575]">
              已打卡 {{ spot.successfulCount }} 次
            </p>
            <p v-if="!spot.canCheckin" class="mt-1 text-xs leading-4 text-[#909090]">
              {{ getSpotStatusText(spot) }}
            </p>
            <p v-if="!spot.canCheckin && spot.nextAvailableTime" class="mt-1 text-xs leading-4 text-[#909090]">
              下次可打卡：{{ formatDateTime(spot.nextAvailableTime) }}
            </p>

            <button
              v-if="spot.canCheckin"
              type="button"
              class="mt-3 h-10 w-full rounded-[8px] bg-[#A660A3] text-sm font-semibold text-white disabled:opacity-60"
              :disabled="checkingInId === spot.id"
              @click="submitCheckIn(spot)"
            >
              {{ checkingInId === spot.id ? '打卡中...' : '立即打卡' }}
            </button>
            <button
              v-else-if="!spot.isWithinRadius"
              type="button"
              class="mt-3 h-10 w-full rounded-[8px] border border-[#cfcfcf] bg-white text-sm font-medium text-[#909090]"
              @click="openMap(spot)"
            >
              開啟地圖 ↗
            </button>
            <button
              v-else
              type="button"
              class="mt-3 h-10 w-full rounded-[8px] border border-[#dcdcdc] bg-[#ededed] text-sm font-medium text-[#909090]"
              disabled
            >
              暫不可打卡
            </button>
          </article>
        </div>
      </section>

      <section class="bg-white px-4 pb-6 pt-3">
        <h2 class="mb-[11px] text-sm font-semibold text-[#495057]">打卡紀錄</h2>
        <div v-if="checkedInSpots.length === 0" class="rounded-lg bg-[#f8f6fb] px-4 py-8 text-center text-sm text-[#757575]">
          尚未有打卡紀錄
        </div>
        <div v-else class="space-y-3">
          <article
            v-for="spot in checkedInSpots"
            :key="spot.id"
            class="rounded-lg bg-[#f5f5f5] px-4 py-3"
          >
            <h3 class="text-[14px] font-medium leading-5 text-[#909090]">{{ spot.name }} ✓</h3>
            <p class="mt-1 text-xs leading-4 text-[#b0b0b0]">已打卡 {{ spot.successfulCount }} 次</p>
            <p v-if="spot.nextAvailableTime" class="mt-1 text-xs leading-4 text-[#b0b0b0]">
              下次可打卡：{{ formatDateTime(spot.nextAvailableTime) }}
            </p>
          </article>
        </div>
      </section>
    </template>
  </main>
</template>

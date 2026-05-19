<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/userStore'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import pointActivityService from '../services/pointActivityService'

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
const toastMessage = ref('')
const userLocation = ref(null)
const checkInPoints = ref([])

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeCheckInPoint = (item = {}) => {
  const lineUser = item.line_user ?? item.lineUser ?? {}
  const checkedIn =
    item.checked_in ??
    item.is_checked_in ??
    item.has_checked_in ??
    item.reached_limit ??
    lineUser.checked_in ??
    lineUser.is_checked_in ??
    false

  return {
    ...item,
    id: item.id ?? item.check_in_point_id ?? item.cid,
    name: item.name ?? item.title ?? '未命名打卡點',
    address: item.address ?? '',
    latitude: toNumber(item.latitude ?? item.lat, null),
    longitude: toNumber(item.longitude ?? item.lng, null),
    radius: toNumber(item.radius_meters ?? item.radius, 100),
    isActive: item.is_active ?? item.enabled ?? item.status !== 'disabled',
    checkedIn: Boolean(checkedIn),
  }
}

const rowsFromResponse = (response = {}) => {
  const result = response.result
  const data = result?.data ?? result
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return []
}

const activeCheckInPoints = computed(() =>
  checkInPoints.value
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      ...item,
      distance: calculateDistance(item),
    })),
)

const showToast = (message) => {
  toastMessage.value = message
  window.setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = ''
    }
  }, 2200)
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

const loadUserLocation = async () => {
  locationMessage.value = ''

  try {
    const position = await requestCurrentPosition()
    userLocation.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }
  } catch (error) {
    console.error('取得 GPS 失敗:', error)
    locationMessage.value = '請開啟定位權限'
    userLocation.value = null
  }
}

const loadCheckInPoints = async () => {
  if (!activityId.value) {
    errorMessage.value = '缺少活動 ID'
    return
  }

  try {
    const response = await pointActivityService.getCheckInPoints(activityId.value, {
      line_user_id: lineUserId.value,
    })
    checkInPoints.value = rowsFromResponse(response).map(normalizeCheckInPoint)
  } catch (error) {
    console.error('取得打卡點失敗:', error)
    errorMessage.value = error?.message || '取得打卡點失敗，請稍後再試'
  }
}

const refreshPage = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    await loadUserLocation()
    await loadCheckInPoints()
  } finally {
    loading.value = false
  }
}

const toRadians = (degree) => degree * (Math.PI / 180)

const calculateDistance = (point) => {
  if (!userLocation.value || point.latitude == null || point.longitude == null) {
    return null
  }

  const earthRadiusMeters = 6371000
  const lat1 = toRadians(userLocation.value.latitude)
  const lat2 = toRadians(point.latitude)
  const deltaLat = toRadians(point.latitude - userLocation.value.latitude)
  const deltaLng = toRadians(point.longitude - userLocation.value.longitude)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(earthRadiusMeters * c)
}

const formatDistance = (distance) => {
  if (distance == null) return '定位中'
  if (distance < 1000) return `${distance} 公尺`
  return `${(distance / 1000).toFixed(1)} 公里`
}

const getButtonText = (point) => {
  if (point.checkedIn) return '已打卡'
  if (point.distance == null) return '定位中'
  if (point.distance > point.radius) return `需到 ${point.radius} 公尺內`
  return '打卡'
}

const canCheckIn = (point) =>
  Boolean(userLocation.value) &&
  !point.checkedIn &&
  point.distance != null &&
  point.distance <= point.radius &&
  !checkingInId.value

const getSuccessPoints = (response = {}) => {
  const data = response.result?.data ?? response.result ?? response
  return data.points_earned ?? data.earned_points ?? data.points_delta ?? data.points ?? null
}

const markCheckedIn = (pointId) => {
  checkInPoints.value = checkInPoints.value.map((item) =>
    item.id === pointId
      ? {
          ...item,
          checkedIn: true,
        }
      : item,
  )
}

const submitCheckIn = async (point) => {
  if (!canCheckIn(point)) return

  checkingInId.value = point.id
  errorMessage.value = ''

  try {
    const response = await pointActivityService.submitCheckIn(activityId.value, {
      line_user_id: lineUserId.value,
      check_in_point_id: point.id,
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
    })

    const success = response.success ?? response.result?.success ?? response.result?.data?.success ?? true
    if (!success) {
      throw new Error(response.message ?? response.result?.message ?? '打卡失敗')
    }

    markCheckedIn(point.id)
    const points = getSuccessPoints(response)
    showToast(points == null ? '打卡成功' : `+${points} 點！`)
  } catch (error) {
    console.error('打卡失敗:', error)
    errorMessage.value = error?.message || '打卡失敗，請稍後再試'
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
    <NavBar title="打卡集點" />

    <section class="px-4 pb-4 pt-4 text-white">
      <p class="text-xs font-semibold tracking-[0.08em]">CHECK IN</p>
      <h2 class="mt-1 text-[22px] font-bold leading-7">選擇附近打卡點</h2>
      <p class="mt-2 text-sm leading-5 text-white/90">請允許定位權限，系統會依照目前位置判斷是否可打卡。</p>
    </section>

    <section class="min-h-[calc(100vh-144px)] rounded-t-[28px] bg-white px-4 py-5">
      <div v-if="toastMessage" class="mb-3 rounded-lg bg-[#f0f9eb] px-4 py-3 text-center text-sm font-semibold text-[#67c23a]">
        {{ toastMessage }}
      </div>

      <div v-if="loading" class="rounded-lg bg-[#f8f6fb] px-4 py-10 text-center text-sm text-[#757575]">
        打卡點載入中...
      </div>

      <template v-else>
        <div v-if="locationMessage" class="mb-3 rounded-lg bg-[#fff4f4] px-4 py-3 text-sm text-[#d35b5b]">
          {{ locationMessage }}
        </div>

        <div v-if="errorMessage" class="mb-3 rounded-lg bg-[#fff4f4] px-4 py-3 text-sm text-[#d35b5b]">
          {{ errorMessage }}
        </div>

        <div v-if="activeCheckInPoints.length === 0" class="rounded-lg bg-[#f8f6fb] px-4 py-10 text-center text-sm text-[#757575]">
          目前沒有可打卡的地點
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="point in activeCheckInPoints"
            :key="point.id"
            class="rounded-lg border border-[#e5d8eb] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.08)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-[16px] font-bold leading-6 text-[#495057]">{{ point.name }}</h3>
                <p class="mt-1 text-xs leading-5 text-[#757575]">{{ point.address || '未提供地址' }}</p>
              </div>
              <span class="shrink-0 rounded-full bg-[#f4eef6] px-3 py-1 text-xs font-semibold text-[#A660A3]">
                {{ formatDistance(point.distance) }}
              </span>
            </div>

            <div class="mt-3 flex items-center justify-between gap-3">
              <p class="text-xs text-[#909399]">可打卡半徑：{{ point.radius }} 公尺</p>
              <button
                type="button"
                class="h-8 rounded-[8px] bg-[#A660A3] px-4 text-xs font-semibold text-white disabled:bg-[#c9c0ce]"
                :disabled="!canCheckIn(point)"
                @click="submitCheckIn(point)"
              >
                {{ checkingInId === point.id ? '打卡中...' : getButtonText(point) }}
              </button>
            </div>
          </article>
        </div>

        <button
          type="button"
          class="mt-4 w-full rounded-lg border border-[#d5cde0] bg-white py-3 text-sm font-semibold text-[#7d7487]"
          @click="refreshPage"
        >
          重新定位
        </button>
      </template>
    </section>
  </main>
</template>

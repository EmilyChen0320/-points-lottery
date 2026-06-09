<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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

const loading = ref(true)
const redeeming = ref(false)
const errorMessage = ref('')
const redeemErrorMessage = ref('')
const redeemStatus = ref('idle')
const coupon = ref(null)
const myCouponUrl = ref('')
const myCouponUrlLoading = ref(false)
const myCouponUrlError = ref('')
const currentPoints = ref(null)
const activityId = computed(() => String(route.params.activityId ?? ''))
const couponId = computed(() => String(route.params.couponId ?? ''))
const costPoints = computed(() => Number(coupon.value?.points_required ?? 0))
const hasEnoughPoints = computed(() => {
  if (currentPoints.value === null) return true
  return currentPoints.value >= costPoints.value
})
const isUnlimitedCouponTotal = computed(() => {
  const totalLimit =
    coupon.value?.total_limit ??
    coupon.value?.coupon_total ??
    coupon.value?.total_quota ??
    coupon.value?.limit_qty
  return Number(totalLimit) === -1
})
const totalQuotaText = computed(() => {
  if (isUnlimitedCouponTotal.value) return '無限制'
  const totalQuota = Number(coupon.value?.total_quota ?? coupon.value?.total_limit ?? 0)
  if (!totalQuota) return '--'
  return `${totalQuota} 張`
})
const userQuotaText = computed(() => {
  const userQuota = Number(coupon.value?.user_quota ?? 0)
  if (!userQuota) return '--'
  if (userQuota === -1) return '無限制'
  return `${userQuota} 張`
})
const dateText = computed(() => {
  const start = coupon.value?.start_date ? formatDate(coupon.value.start_date) : '--/--'
  const end = coupon.value?.end_date ? formatDate(coupon.value.end_date) : '--/--'
  return `${start} ~ ${end}`
})
const lineUserId = computed(() => {
  if (testMode.value) {
    return userId.value || window.endpoint?.lineUserId || window.endpoint?.testUserId || ''
  }
  return userId.value || ''
})

const parsePoints = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const statusTitle = computed(() => (redeemStatus.value === 'success' ? '兌換成功' : '兌換失敗'))
const statusChipText = computed(() =>
  redeemStatus.value === 'success'
    ? `已扣除 ${costPoints.value} 點`
    : redeemErrorMessage.value || `點數不足：需要 ${costPoints.value} 點`,
)

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--/--'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}/${day}`
}

const toFriendlyRedeemErrorMessage = (error) => {
  const rawMessage = String(
    error?.message || error?.response?.result?.message || error?.response?.message || '',
  )
  if (rawMessage.includes('liffId is necessary for liff.init')) {
    return 'LIFF 尚未初始化完成，請稍後再試'
  }
  return rawMessage || '兌換失敗，請稍後再試'
}

const fetchCouponInfo = async () => {
  if (!activityId.value || !couponId.value) {
    errorMessage.value = '缺少活動或優惠券參數'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const [couponResponse, pointsResponse] = await Promise.all([
      pointActivityService.getCouponInfo(activityId.value, couponId.value),
      lineUserId.value
        ? pointActivityService.getLineUserPoints(activityId.value, {
            line_user_id: lineUserId.value,
          })
        : Promise.resolve(null),
    ])
    coupon.value = couponResponse?.result?.data ?? null
    currentPoints.value = pointsResponse
      ? parsePoints(pointsResponse?.result?.data?.points)
      : currentPoints.value
  } catch (error) {
    errorMessage.value = error?.message || '取得優惠券資訊失敗'
  } finally {
    loading.value = false
  }
}

const resetMyCouponUrl = () => {
  myCouponUrl.value = ''
  myCouponUrlLoading.value = false
  myCouponUrlError.value = ''
}

const fetchMyCouponUrl = async () => {
  resetMyCouponUrl()
  myCouponUrlLoading.value = true

  try {
    const response = await pointActivityService.getLiffApps()
    const apps = response?.result?.data ?? response?.data ?? {}
    const url = String(apps?.my_coupon?.actions?.index?.url ?? '').trim()

    if (!url) {
      throw new Error('找不到票券夾連結')
    }

    myCouponUrl.value = url
  } catch (error) {
    myCouponUrl.value = ''
    myCouponUrlError.value = '票券夾連結讀取失敗，請稍後再試'
    console.error('取得票券夾 LIFF 連結失敗:', error)
  } finally {
    myCouponUrlLoading.value = false
  }
}

const handleConfirmRedeem = async () => {
  if (!coupon.value || redeeming.value) return
  if (!lineUserId.value) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = '缺少 LINE 使用者資訊，請重新開啟頁面'
    return
  }
  if (!hasEnoughPoints.value) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = `點數不足：需要 ${costPoints.value} 點，目前 ${currentPoints.value} 點`
    return
  }

  redeeming.value = true
  redeemErrorMessage.value = ''

  try {
    await pointActivityService.redeemCoupon(activityId.value, {
      couponId: couponId.value,
      lineUserId: lineUserId.value,
    })

    await fetchMyCouponUrl()
    redeemStatus.value = 'success'
    if (currentPoints.value !== null) {
      currentPoints.value = Math.max(currentPoints.value - costPoints.value, 0)
    }
  } catch (error) {
    redeemStatus.value = 'fail'
    redeemErrorMessage.value = toFriendlyRedeemErrorMessage(error)
  } finally {
    redeeming.value = false
  }
}

const goToMyCoupon = () => {
  if (!myCouponUrl.value) return
  window.location.href = myCouponUrl.value
}

const backToRedeemHome = () => {
  if (!activityId.value) {
    router.push('/')
    return
  }
  router.push({ name: 'redeem-home', params: { activityId: activityId.value } })
}

onMounted(fetchCouponInfo)
watch(
  () => [route.params.activityId, route.params.couponId, lineUserId.value],
  fetchCouponInfo,
)
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-[#FAFAFA] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="redeemStatus === 'idle' ? '兌換優惠券' : '兌換結果'" />

    <template v-if="loading">
      <section class="px-4 pt-6">
        <div class="rounded-lg bg-white px-4 py-10 text-center text-sm text-[#757575] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
          優惠券資料載入中...
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
      <section class="relative h-[196px] overflow-hidden bg-[#6d4f78]">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/45"></div>
        <div class="relative flex h-full flex-col justify-end px-4 pb-3 text-white">
          <h1 class="text-[20px] font-bold leading-7">{{ coupon?.name || '優惠券兌換' }}</h1>
          <p class="mt-1 text-xs">{{ dateText }}</p>
        </div>
      </section>

      <section class="px-4 pb-6 pt-6">
        <article
          class="rounded-lg border border-[#E8E8E8] bg-white p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
          style="border-width: 0.6px"
        >
          <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">{{ coupon?.name || '未命名優惠券' }}</h2>
          <p class="mt-1 text-xs leading-4 text-[#757575]">{{ coupon?.description || coupon?.instructions || '暫無說明' }}</p>

          <div class="mt-3 rounded-md border border-[#A660A3] bg-[rgba(166,96,163,0.05)] p-3">
            <p class="text-xs text-[#757575]">所需點數</p>
            <div class="mt-2 flex items-center justify-between gap-3">
              <p class="text-[20px] font-bold leading-6 text-[#A660A3]">{{ costPoints }} 點</p>
              <p class="text-right text-xs text-[#A660A3]">有效期限：{{ dateText }}</p>
            </div>
          </div>

          <p class="mt-3 text-xs text-[#757575]">總庫存：{{ totalQuotaText }} | 每人可兌換：{{ userQuotaText }}</p>
          <p class="mt-1 text-xs font-medium text-[#009734]">
            我的點數：{{ currentPoints ?? '--' }} 點（{{ hasEnoughPoints ? '足夠' : '不足' }}）
          </p>
        </article>

        <div class="mt-10">
          <button
            type="button"
            class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="redeeming"
            @click="handleConfirmRedeem"
          >
            {{ redeeming ? '兌換中...' : `確認兌換（扣除 ${costPoints} 點）` }}
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
        <h2 class="text-[14px] font-semibold leading-5 text-[#495057]">{{ coupon?.name || '優惠券' }}</h2>
        <p class="mt-2 text-sm font-medium text-[#495057]">已自動加入您的票券夾</p>
        <button
          type="button"
          class="mt-3 w-full rounded-md bg-[#A660A3] py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="myCouponUrlLoading || !myCouponUrl"
          @click="goToMyCoupon"
        >
          {{ myCouponUrlLoading ? '票券夾連結讀取中...' : '前往票券夾' }}
        </button>
        <p v-if="myCouponUrlError" class="mt-2 text-xs leading-4 text-[#d35b5b]">
          {{ myCouponUrlError }}
        </p>
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

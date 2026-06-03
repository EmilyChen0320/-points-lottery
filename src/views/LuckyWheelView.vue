<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import lottie from 'lottie-web'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import giftGroupImage from '../assets/images/Group.png'
import spinWheelAnimation from '../assets/animations/spin-wheel.json'
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

const wheelContainer = ref(null)
const wheelAnimationReady = ref(false)
let animationInstance = null

const getSanitizedSpinWheelAnimation = () => {
  const animationData = JSON.parse(JSON.stringify(spinWheelAnimation))
  animationData.layers = (animationData.layers ?? []).filter(
    (layer) => layer?.nm !== 'Shape Layer 1',
  )
  return animationData
}

const loading = ref(true)
const drawing = ref(false)
const errorMessage = ref('')
const drawErrorMessage = ref('')
const drawStatus = ref('idle')
/** 最近一次 POST redeem/lotteries 的 lottery_record（含 prize） */
const lastLotteryRecord = ref(null)
const lottery = ref(null)
const currentPoints = ref(0)
const remainingCount = ref(0)
const drawCouponDetail = ref(null)
const drawCouponDetailLoading = ref(false)
const drawCouponDetailError = ref('')
const drawCouponCopyFeedback = ref('')

const drawCost = computed(() => Number(lottery.value?.points_required ?? 0))
const prizeItems = computed(() =>
  (lottery.value?.prizes ?? []).map((item) => ({
    id: item.id,
    label: item.name || '未命名獎品',
    rate: formatProbability(item.probability),
    image: item.image || '',
    isConsolation: Boolean(item.is_consolation),
  })),
)

const parseLotteryRecordFromRedeemResponse = (response) => {
  const data = response?.result?.data ?? {}
  const record = data?.lottery_record ?? data?.record ?? null
  if (!record || typeof record !== 'object') return null
  return record
}

const normalizeCouponDetailPayload = (response) => {
  const payload = response?.result?.data ?? response?.result ?? response?.data?.result ?? response?.data ?? null
  return payload && typeof payload === 'object' && !payload.exception ? payload : null
}

const extractCouponCodeFromObject = (obj) => {
  if (!obj || typeof obj !== 'object') return ''
  const direct =
    obj.code ||
    obj.coupon_code ||
    obj.redeem_code ||
    obj.promotion_code ||
    obj.serial_number
  if (direct) return String(direct)
  if (obj.user_coupon_code && typeof obj.user_coupon_code === 'object') {
    const nested = extractCouponCodeFromObject(obj.user_coupon_code)
    if (nested) return nested
  }
  return ''
}

const findNestedValue = (obj, matcher, depth = 4) => {
  if (!obj || typeof obj !== 'object' || depth < 0) return ''

  for (const [key, value] of Object.entries(obj)) {
    if (matcher(key, value)) return String(value)
    if (value && typeof value === 'object') {
      const nested = findNestedValue(value, matcher, depth - 1)
      if (nested) return nested
    }
  }

  return ''
}

const resolveLotteryUserCouponCodeId = (record) => {
  const nested = record?.user_coupon_code
  const candidates = [
    nested?.id,
    nested?.user_coupon_code_id,
    record?.user_coupon_code_id,
  ]
  const hit = candidates.find((value) => value !== undefined && value !== null && value !== '')
  if (hit) return String(hit)

  return findNestedValue(
    record,
    (key, value) =>
      key === 'user_coupon_code_id' &&
      value !== undefined &&
      value !== null &&
      value !== '',
  )
}

const drawRecordStatus = computed(() => String(lastLotteryRecord.value?.status ?? '').toLowerCase())
const drawPrize = computed(() => lastLotteryRecord.value?.prize ?? null)
const isDrawCouponPrize = computed(() => {
  const p = drawPrize.value
  const prizeType = String(p?.type ?? p?.prize_type ?? '').toLowerCase()
  return (
    prizeType === 'coupon' ||
    Boolean(resolveLotteryUserCouponCodeId(lastLotteryRecord.value)) ||
    Boolean(extractCouponCodeFromObject(lastLotteryRecord.value?.user_coupon_code))
  )
})
const drawCouponCode = computed(() => extractCouponCodeFromObject(drawCouponDetail.value))
const drawCoupon = computed(() => drawCouponDetail.value?.coupon ?? null)
const drawCouponRedemptionMethod = computed(() => {
  const methods = drawCoupon.value?.redemption_methods ?? drawCouponDetail.value?.redemption_methods ?? []
  return Array.isArray(methods) ? String(methods[0] ?? '') : String(methods ?? '')
})
const drawCouponName = computed(() => {
  const couponName = String(drawCoupon.value?.name ?? '').trim()
  if (couponName) return couponName
  return String(drawPrize.value?.name ?? '').trim()
})
const drawCouponDescription = computed(() => {
  const coupon = drawCoupon.value
  return String(coupon?.description || coupon?.instructions || '').trim()
})
const drawCouponRedirectUrl = computed(() =>
  drawCouponRedemptionMethod.value === 'redirect' ? drawCouponCode.value : '',
)
const shouldShowCouponCopyButton = computed(
  () => drawCouponRedemptionMethod.value === 'code_copy' && Boolean(drawCouponCode.value),
)
const drawPrizeTitle = computed(() => {
  const p = drawPrize.value
  if (!p || typeof p !== 'object') return ''
  if (isDrawCouponPrize.value) return drawCouponName.value || '優惠券'
  return String(p.name || p.content || '').trim()
})
const drawPrizeSubtitle = computed(() => {
  const p = drawPrize.value
  if (isDrawCouponPrize.value) return drawCouponDescription.value
  if (!p?.content) return ''
  const title = drawPrizeTitle.value
  const content = String(p.content).trim()
  if (!content || content === title) return ''
  return content
})
const drawIsConsolation = computed(() => Boolean(drawPrize.value?.is_consolation))
const isDrawWon = computed(() => drawRecordStatus.value === 'won')
const isDrawLost = computed(() => ['lost', 'lose', 'missed', 'no_win'].includes(drawRecordStatus.value))

const pickImageUrl = (obj) => {
  if (!obj || typeof obj !== 'object') return ''
  const candidates = [obj.image, obj.image_url, obj.cover_image, obj.cover_url, obj.thumbnail]
  const hit = candidates.find((v) => typeof v === 'string' && v.trim())
  return hit ? hit.trim() : ''
}

/** 兌獎回應的 prize 圖，或從活動獎品清單依 id 補上（後端常在 redeem 的 prize 省略 image） */
const drawPrizeImageUrl = computed(() => {
  const p = drawPrize.value
  if (!p || typeof p !== 'object') return ''
  const fromPrize = pickImageUrl(p)
  if (fromPrize) return fromPrize
  const prizeId = p.id
  if (!prizeId || !Array.isArray(lottery.value?.prizes)) return ''
  const match = lottery.value.prizes.find((row) => row?.id === prizeId)
  return pickImageUrl(match || {})
})

const drawPrizeImageError = ref(false)

watch(
  () => [drawPrize.value?.id, drawPrizeImageUrl.value],
  () => {
    drawPrizeImageError.value = false
  },
)

const shouldShowDrawPrizeImage = computed(
  () => Boolean(drawPrizeImageUrl.value) && !drawPrizeImageError.value,
)

const onDrawPrizeImageError = () => {
  drawPrizeImageError.value = true
}

const resultTitle = computed(() => {
  if (drawStatus.value !== 'success') return '抽獎失敗'
  if (isDrawWon.value) return '恭喜中獎'
  if (isDrawLost.value) return '銘謝惠顧'
  return '抽獎完成'
})

const resultChipText = computed(() => {
  if (drawStatus.value === 'success') {
    return `已扣除 ${drawCost.value} 點，剩餘 ${currentPoints.value} 點`
  }

  return drawErrorMessage.value || '抽獎失敗，請稍後再試'
})

const resetDrawCouponDetail = () => {
  drawCouponDetail.value = null
  drawCouponDetailLoading.value = false
  drawCouponDetailError.value = ''
  drawCouponCopyFeedback.value = ''
}

const fetchDrawCouponDetail = async () => {
  resetDrawCouponDetail()
  if (!isDrawCouponPrize.value || !lineUserId.value) return

  drawCouponDetailLoading.value = true
  try {
    const userCouponCodeId = resolveLotteryUserCouponCodeId(lastLotteryRecord.value)
    const couponCode =
      extractCouponCodeFromObject(lastLotteryRecord.value) ||
      extractCouponCodeFromObject(drawPrize.value)
    let response = null

    if (userCouponCodeId) {
      try {
        response = await pointActivityService.getUserCouponCode(lineUserId.value, userCouponCodeId)
      } catch (error) {
        if (!couponCode) throw error
        response = await pointActivityService.getLineUserCouponByCode(lineUserId.value, couponCode)
      }
    } else if (couponCode) {
      response = await pointActivityService.getLineUserCouponByCode(lineUserId.value, couponCode)
    }

    const detail = normalizeCouponDetailPayload(response)
    if (detail) {
      drawCouponDetail.value = detail
    } else {
      drawCouponDetailError.value = '優惠券資訊讀取失敗'
    }
  } catch (error) {
    drawCouponDetail.value = null
    drawCouponDetailError.value = error?.message || '優惠券資訊讀取失敗'
    console.error('取得抽獎優惠券詳情失敗:', error)
  } finally {
    drawCouponDetailLoading.value = false
  }
}

const copyDrawCouponCode = async () => {
  if (!drawCouponCode.value) return
  drawCouponCopyFeedback.value = ''
  try {
    await navigator.clipboard.writeText(drawCouponCode.value)
    drawCouponCopyFeedback.value = '已複製到剪貼簿'
  } catch (error) {
    drawCouponCopyFeedback.value = '無法自動複製，請長按優惠碼手動選取'
  } finally {
    setTimeout(() => {
      drawCouponCopyFeedback.value = ''
    }, 2000)
  }
}

const drawResultCardHeadline = computed(() => {
  if (isDrawWon.value && drawPrizeTitle.value) return '您獲得'
  if (isDrawLost.value) return '本次未中獎'
  return '抽獎已完成'
})

const hasEnoughPoints = computed(() => currentPoints.value >= drawCost.value)
const isUnlimitedDailyEntries = computed(() => Number(lottery.value?.daily_limit ?? 0) === -1)
const hasRemainingEntries = computed(
  () => isUnlimitedDailyEntries.value || remainingCount.value > 0,
)
const remainingCountText = computed(() =>
  isUnlimitedDailyEntries.value ? '今日不限次數' : `今日剩餘 ${remainingCount.value} 次`,
)
const drawButtonDisabled = computed(
  () => drawing.value || !hasEnoughPoints.value || !hasRemainingEntries.value,
)

const formatProbability = (value) => {
  const numericValue = Number(value ?? 0)
  if (Number.isNaN(numericValue)) return '--'
  if (numericValue >= 0 && numericValue <= 1) {
    return `${(numericValue * 100).toFixed(2)}%`
  }
  return `${numericValue.toFixed(2)}%`
}

const applyLotteryDetail = (data) => {
  lottery.value = data ?? null
  currentPoints.value = Number(data?.line_user?.points ?? 0)
  remainingCount.value = Number(data?.line_user?.remaining_entries_today ?? 0)
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
    console.error('取得幸運大轉盤資料失敗:', error)
    errorMessage.value = error?.message || '取得抽獎資料失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

const initWheelAnimation = () => {
  if (!wheelContainer.value) return
  if (animationInstance) return

  animationInstance = lottie.loadAnimation({
    container: wheelContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: getSanitizedSpinWheelAnimation(),
  })

  wheelContainer.value.style.background = 'transparent'
  wheelAnimationReady.value = true
}

const destroyWheelAnimation = () => {
  if (animationInstance) {
    animationInstance.destroy()
    animationInstance = null
  }
  wheelAnimationReady.value = false
}

const handleDraw = async () => {
  if (drawing.value) return

  if (!lineUserId.value) {
    drawStatus.value = 'fail'
    drawErrorMessage.value = '缺少 LINE 使用者資訊，請重新開啟頁面'
    return
  }

  if (!hasEnoughPoints.value) {
    drawStatus.value = 'fail'
    drawErrorMessage.value = `點數不足：需要 ${drawCost.value} 點，目前 ${currentPoints.value} 點`
    return
  }

  if (!hasRemainingEntries.value) {
    drawStatus.value = 'fail'
    drawErrorMessage.value = '今日抽獎次數已用完'
    return
  }

  drawing.value = true
  drawErrorMessage.value = ''

  try {
    const redeemResponse = await pointActivityService.redeemLottery(activityId.value, {
      lotteryId: lotteryId.value,
      lineUserId: lineUserId.value,
    })

    lastLotteryRecord.value = parseLotteryRecordFromRedeemResponse(redeemResponse)
    await fetchDrawCouponDetail()

    const detailResponse = await pointActivityService.getLotteryInfo(activityId.value, lotteryId.value, {
      line_user_id: lineUserId.value,
    })
    applyLotteryDetail(detailResponse?.result?.data ?? null)
    drawStatus.value = 'success'
  } catch (error) {
    drawStatus.value = 'fail'
    drawErrorMessage.value = error?.message || '抽獎失敗，請稍後再試'
  } finally {
    drawing.value = false
  }
}

watch(
  () => loading.value,
  async (isLoading) => {
    if (!isLoading && drawStatus.value === 'idle') {
      await nextTick()
      initWheelAnimation()
    }
  },
)

watch(
  () => drawStatus.value,
  async (status) => {
    if (status === 'idle' && !loading.value) {
      await nextTick()
      initWheelAnimation()
      return
    }

    if (status !== 'idle') {
      destroyWheelAnimation()
    }
  },
)

const drawAgain = () => {
  lastLotteryRecord.value = null
  resetDrawCouponDetail()
  drawStatus.value = 'idle'
}

const backToRedeemHome = () => {
  if (!activityId.value) {
    router.push('/')
    return
  }
  router.push({ name: 'redeem-home', params: { activityId: activityId.value } })
}

onMounted(async () => {
  await fetchLotteryInfo()
})

onBeforeUnmount(() => {
  destroyWheelAnimation()
})
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="drawStatus === 'idle' ? (lottery?.name || '幸運大轉盤') : '抽獎結果'" />

    <template v-if="loading">
      <section class="px-4 pt-6">
        <div class="rounded-lg bg-white px-4 py-10 text-center text-sm text-[#757575] shadow-[0_0_6px_rgba(0,0,0,0.10)]">
          抽獎資料載入中...
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

    <section v-else-if="drawStatus === 'idle'" class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <p class="text-[14px] font-medium text-white">{{ remainingCountText }}</p>
        <div class="relative mt-3 flex h-[250px] w-[250px] items-center justify-center">
          <div
            ref="wheelContainer"
            class="relative z-10 h-[220px] w-[220px] overflow-hidden rounded-full [&_svg]:h-full [&_svg]:w-full [&_svg]:!bg-transparent"
          ></div>
          <div
            v-if="!wheelAnimationReady"
            class="absolute inset-0 z-0 flex items-center justify-center text-sm font-medium text-white/75"
          >
            載入轉盤中...
          </div>
        </div>
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="drawButtonDisabled"
        @click="handleDraw"
      >
        {{ drawing ? '抽獎中...' : `抽獎（消耗 ${drawCost} 點）` }}
      </button>

      <article
        class="relative mt-6 rounded-md bg-gradient-to-b from-white to-[rgba(166,96,163,0.08)] p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
      >
        <h2 class="text-[14px] font-semibold text-[#A660A3]">獎品清單</h2>
        <ul class="mt-3 space-y-2 pr-[96px]">
          <li v-for="item in prizeItems" :key="item.id" class="text-[12px] text-[#757575]">
            <div class="min-w-0">
              <span class="block truncate">{{ item.label }}</span>
              <span
                v-if="item.isConsolation"
                class="mt-1 inline-flex rounded-sm bg-[rgba(244,159,37,0.12)] px-2 py-0.5 text-[10px] text-[#F49F25]"
              >
                安慰獎
              </span>
              <span class="mt-1 block font-medium">{{ item.rate }}</span>
            </div>
          </li>
        </ul>
        <img
          :src="giftGroupImage"
          alt="gift decoration"
          class="pointer-events-none absolute bottom-[-9px] right-5 h-24 w-24 object-contain"
        />
      </article>
    </section>

    <section v-else class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <div class="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-white text-xl font-bold text-white">
          {{ drawStatus === 'success' ? '✓' : '✕' }}
        </div>
        <h1 class="mt-3 text-[20px] font-bold text-white">{{ resultTitle }}</h1>
        <p
          class="mt-2 inline-flex items-center justify-center rounded-[24px] border border-white bg-[#A660A3] px-8 py-2 text-[14px] font-medium leading-6 text-white"
        >
          {{ resultChipText }}
        </p>
      </div>

      <article
        v-if="drawStatus === 'success'"
        class="mt-10 rounded-lg border border-[#E8E8E8] bg-white px-6 py-8 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
      >
        <h2 class="text-center text-[17px] font-bold leading-5 text-[#495057]">{{ drawResultCardHeadline }}</h2>
        <template v-if="isDrawWon && drawPrizeTitle">
          <div v-if="shouldShowDrawPrizeImage" class="mt-5 flex justify-center">
            <div
              class="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[rgba(166,96,163,0.06)] ring-1 ring-[rgba(166,96,163,0.12)]"
            >
              <img
                :src="drawPrizeImageUrl"
                :alt="drawPrizeTitle"
                class="max-h-full max-w-full object-contain"
                @error="onDrawPrizeImageError"
              />
            </div>
          </div>
          <p
            class="text-center text-[22px] font-bold leading-7 text-[#A660A3]"
            :class="shouldShowDrawPrizeImage ? 'mt-4' : 'mt-3'"
          >
            {{ drawPrizeTitle }}
          </p>
          <p v-if="drawPrizeSubtitle" class="mt-2 text-center text-sm leading-5 text-[#757575]">
            {{ drawPrizeSubtitle }}
          </p>
          <div v-if="isDrawCouponPrize" class="mt-5 rounded-md bg-[#faf9fc] px-4 py-4 text-center">
            <p v-if="drawCouponDetailLoading" class="text-sm font-medium text-[#757575]">
              優惠券資訊讀取中...
            </p>
            <p v-else-if="drawCouponDetailError" class="text-sm font-medium text-[#d35b5b]">
              {{ drawCouponDetailError }}
            </p>
            <template v-else-if="drawCouponDetail">
              <div
                v-if="drawCouponRedemptionMethod === 'qr_code' && drawCouponDetail?.qr_code"
                class="mx-auto flex min-h-36 w-36 items-center justify-center [&_svg]:h-36 [&_svg]:w-36"
                v-html="drawCouponDetail.qr_code"
              ></div>
              <div
                v-if="drawCouponCode && drawCouponRedemptionMethod !== 'redirect'"
                class="rounded-md border border-[#E8E8E8] bg-white px-3 py-3"
              >
                <p class="text-xs font-medium text-[#757575]">
                  {{ drawCouponRedemptionMethod === 'barcode' ? '優惠券條碼' : '優惠券碼' }}
                </p>
                <p class="mt-1 break-all text-[20px] font-bold leading-7 text-[#495057]">
                  {{ drawCouponCode }}
                </p>
              </div>
              <a
                v-if="drawCouponRedirectUrl"
                :href="drawCouponRedirectUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex w-full items-center justify-center rounded-md bg-[#A660A3] py-3 text-[15px] font-bold text-white"
              >
                開啟優惠券
              </a>
              <button
                v-if="shouldShowCouponCopyButton"
                type="button"
                class="mt-3 w-full rounded-md border border-[#A660A3] bg-white py-2 text-sm font-bold text-[#A660A3]"
                @click="copyDrawCouponCode"
              >
                複製優惠碼
              </button>
              <p v-if="drawCouponCopyFeedback" class="mt-2 text-xs text-[#009734]">
                {{ drawCouponCopyFeedback }}
              </p>
              <p
                v-if="!drawCouponCode && drawCouponRedemptionMethod !== 'qr_code'"
                class="text-sm font-medium text-[#757575]"
              >
                優惠券已發送，請至優惠券頁查看。
              </p>
            </template>
          </div>
          <div v-if="drawIsConsolation" class="mt-3 flex justify-center">
            <span class="inline-flex rounded-sm bg-[rgba(244,159,37,0.12)] px-2 py-1 text-xs font-medium text-[#F49F25]">
              安慰獎
            </span>
          </div>
        </template>
        <p v-else-if="isDrawLost" class="mt-3 text-center text-sm leading-5 text-[#757575]">
          感謝參與，歡迎下次再試手氣。
        </p>
        <p v-else class="mt-3 text-center text-sm leading-5 text-[#757575]">
          本次抽獎已處理完成。若為定期開獎，請至活動頁或會員中心查看抽獎券與開獎結果。
        </p>
        <p class="mt-5 text-center text-sm leading-5 text-[#757575]">
          {{ remainingCountText }}。
        </p>
      </article>

      <article
        v-else
        class="mt-10 flex items-center justify-center rounded-lg border border-[#A660A3] bg-white px-6 py-8 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
        style="border-width: 0.2px"
      >
        <p class="text-center text-sm font-medium leading-4 text-[#757575]">
          {{ drawErrorMessage || '抽獎失敗，請稍後再試' }}
        </p>
      </article>

      <section class="mt-10 space-y-4">
        <button
          v-if="drawStatus === 'success'"
          type="button"
          class="w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
          @click="drawAgain"
        >
          再抽一次
        </button>
        <button
          type="button"
          class="w-full rounded-md bg-[#E8E8E8] py-3 text-[17px] font-medium text-[#757575]"
          @click="backToRedeemHome"
        >
          返回兌換首頁
        </button>
      </section>
    </section>
  </main>
</template>

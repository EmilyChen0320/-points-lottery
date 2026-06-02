<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/layout/NavBar.vue'

const route = useRoute()
const router = useRouter()

const status = computed(() => String(route.query.status ?? 'failed'))
const isSuccess = computed(() => status.value === 'success')
const isOutOfRange = computed(() => status.value === 'out-of-range')
const distanceText = computed(() => {
  const distance = Number(route.query.distance)
  if (!Number.isFinite(distance)) return '請靠近打卡點再試一次'
  return `距離打卡點 ${Math.round(distance)} 公尺`
})
const resultMessage = computed(() => String(route.query.message || (isSuccess.value ? '感謝您的參與' : '請靠近打卡點再試一次')))
const nextAvailableTime = computed(() => String(route.query.next_available_time || ''))
const resultTitle = computed(() => {
  if (isSuccess.value) return '集點成功!'
  if (isOutOfRange.value) return '不在打卡範圍內'
  return '打卡失敗'
})

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

const goBackToList = () => {
  router.push({
    name: 'check-in',
    params: {
      activityId: route.params.activityId,
    },
  })
}
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-white">
    <section class="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#aa5aaf] via-[#d5acd3] to-white">
      <div class="pointer-events-none absolute -left-12 top-28 h-36 w-36 rounded-full bg-white/10"></div>
      <div class="pointer-events-none absolute right-4 top-0 h-36 w-36 rounded-full bg-white/10"></div>
      <div class="pointer-events-none absolute right-14 top-7 h-24 w-24 rounded-full bg-white/10"></div>
      <NavBar title="集點結果" />

      <section class="relative flex flex-col items-center px-4 pt-8 text-white">
        <div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[24px] leading-none">
          {{ isSuccess ? '✓' : '!' }}
        </div>
        <h1 class="mt-4 text-[20px] font-bold leading-7 drop-shadow-sm">
          {{ resultTitle }}
        </h1>

        <div class="mt-4 min-w-[160px] rounded-full border border-white bg-[#A660A3]/45 px-6 py-2 text-center text-sm font-medium leading-5">
          <template v-if="isSuccess">
            {{ resultMessage }}
          </template>
          <template v-else>
            <p v-if="isOutOfRange">{{ distanceText }}</p>
            <p class="text-xs">{{ resultMessage }}</p>
            <p v-if="nextAvailableTime" class="text-xs">下次可打卡：{{ formatDateTime(nextAvailableTime) }}</p>
          </template>
        </div>

        <button
          type="button"
          class="mt-8 h-12 w-full rounded-[8px] bg-white/85 text-[15px] font-medium text-[#757575]"
          @click="goBackToList"
        >
          {{ isSuccess ? '返回打卡列表' : '重新偵測位置' }}
        </button>
      </section>
    </section>
  </main>
</template>

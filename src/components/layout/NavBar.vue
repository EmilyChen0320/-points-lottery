<script setup>
import { useRoute, useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const route = useRoute()

const onBack = () => {
  const routeName = route.name

  if (routeName === 'redeem-home') {
    router.push({ name: 'home' })
    return
  }

  if (
    routeName === 'redeem-coupon' ||
    routeName === 'redeem-draw-ticket' ||
    routeName === 'redeem-lucky-wheel' ||
    routeName === 'my-draw-tickets' ||
    routeName === 'check-in'
  ) {
    const activityId = route.params.activityId
    if (activityId) {
      router.push({ name: 'redeem-home', params: { activityId } })
      return
    }
  }

  if (routeName === 'check-in-result') {
    const activityId = route.params.activityId
    if (activityId) {
      router.push({ name: 'check-in', params: { activityId } })
      return
    }
  }

  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}

const onClose = () => {
  if (window.liff && typeof window.liff.closeWindow === 'function') {
    window.liff.closeWindow()
    return
  }
  router.push('/')
}
</script>

<template>
  <header class="flex h-12 items-center justify-between px-4 text-white">
    <button type="button" class="w-6 text-[22px] leading-none" aria-label="返回" @click="onBack">‹</button>
    <h1 class="text-[17px] font-medium leading-5">{{ title }}</h1>
    <button type="button" class="w-6 text-[20px] leading-none" aria-label="關閉" @click="onClose">×</button>
  </header>
</template>

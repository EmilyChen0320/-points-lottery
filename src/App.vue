<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/userStore'
import liffService from './services/liffService'
import LoadingView from './views/LoadingView.vue'

const router = useRouter()
const userStore = useUserStore()
const initialTargetPath = router.currentRoute.value.fullPath
const ready = ref(false)

const bootstrapLiff = async () => {
  try {
    const initResult = await liffService.init()
    const env = initResult.env ?? liffService.getEnvironment()

    if (!initResult.testMode && !liffService.isLoggedIn()) {
      liffService.login()
      return
    }

    const fallbackUserId = env.testUserId ?? 'U_TEST_USER_001'
    const userId = initResult.testMode ? fallbackUserId : await liffService.getUserId(fallbackUserId)
    const profile = initResult.testMode
      ? { userId, displayName: '測試使用者', pictureUrl: '' }
      : await liffService.getProfile()
    const friendship = initResult.testMode ? { friendFlag: true } : await liffService.getFriendship()

    userStore.setUserSession({
      testMode: initResult.testMode,
      userId,
      profile,
      friendship,
      environment: env,
    })

    if (router.currentRoute.value.path === '/loading') {
      await router.replace(initialTargetPath === '/loading' ? '/' : initialTargetPath)
    }
  } catch (error) {
    console.error('LIFF 初始化失敗:', error)
  } finally {
    ready.value = true
  }
}

onMounted(async () => {
  await bootstrapLiff()
})
</script>

<template>
  <LoadingView v-if="!ready" />
  <router-view v-else />
</template>

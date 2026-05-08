<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useActivityStore } from '../stores/activityStore'
import ActivityCard from '../components/ActivityCard.vue'
import NavBar from '../components/layout/NavBar.vue'
import giftImage from '../assets/images/gift.png'
import backgroundImage from '../assets/images/background.png'

const activityStore = useActivityStore()
const { activities, loading, errorMessage, pagination } = storeToRefs(activityStore)
const loadingMore = ref(false)
const initialLoadDone = ref(false)

const hasMore = computed(() => pagination.value.currentPage < pagination.value.lastPage)
const showInitialLoading = computed(() => loading.value && !initialLoadDone.value)

const fetchInitialActivities = async () => {
  try {
    await activityStore.fetchActivities()
  } catch (error) {
    console.error('取得集點活動列表失敗:', error)
  } finally {
    initialLoadDone.value = true
  }
}

const handleLoadMore = async () => {
  if (loadingMore.value || loading.value || !hasMore.value) return

  loadingMore.value = true
  try {
    await activityStore.fetchActivities({ append: true })
  } catch (error) {
    console.error('載入更多集點活動失敗:', error)
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  await fetchInitialActivities()
})
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="我的集點活動" />
    <section class="relative h-[122px] overflow-hidden px-6 pt-6 text-white">
      <div class="mt-8 max-w-[200px]">
        <h2 class="text-[17px] font-medium leading-5">我的集點活動</h2>
        <p class="mt-1 text-[14px] font-normal leading-5">各活動點數獨立累計，互不共用</p>
      </div>
      <div class="absolute right-6 top-6 h-[87px] w-[120px]">
        <img
          :src="giftImage"
          alt="gift"
          class="absolute left-[8px] top-0 h-[110px] w-[120px] object-contain"
        />
      </div>
    </section>
    <section class="rounded-t-[32px] bg-white px-4 py-6">
      <div v-if="showInitialLoading" class="rounded-lg bg-[#f8f6fb] px-4 py-8 text-center text-sm text-[#7d7487]">
        集點活動載入中...
      </div>
      <div v-else-if="errorMessage && activities.length === 0" class="rounded-lg bg-[#fff4f4] px-4 py-8 text-center text-sm text-[#d35b5b]">
        {{ errorMessage }}
      </div>
      <div v-else-if="activities.length === 0" class="rounded-lg bg-[#f8f6fb] px-4 py-8 text-center text-sm text-[#7d7487]">
        目前沒有可參與的集點活動
      </div>
      <div v-else class="space-y-4">
        <ActivityCard v-for="item in activities" :key="item.id" :activity="item" />
        <button
          v-if="hasMore"
          type="button"
          class="w-full rounded-lg border border-[#d5cde0] bg-white py-3 text-sm font-semibold text-[#7d7487] disabled:opacity-60"
          :disabled="loadingMore"
          @click="handleLoadMore"
        >
          {{ loadingMore ? '載入中...' : '載入更多活動' }}
        </button>
        <p v-else class="py-1 text-center text-xs text-[#a69db1]">已顯示全部活動</p>
      </div>
    </section>
  </main>
</template>

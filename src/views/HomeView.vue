<script setup>
import { storeToRefs } from 'pinia'
import { useActivityStore } from '../stores/activityStore'
import ActivityCard from '../components/ActivityCard.vue'
import NavBar from '../components/layout/NavBar.vue'
import giftImage from '../assets/images/gift.png'
import backgroundImage from '../assets/images/background.png'

const activityStore = useActivityStore()
const { activities } = storeToRefs(activityStore)
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
      <div class="space-y-4">
        <ActivityCard v-for="item in activities" :key="item.id" :activity="item" />
      </div>
    </section>
  </main>
</template>

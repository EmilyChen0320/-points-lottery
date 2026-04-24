<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import lottie from 'lottie-web'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import giftGroupImage from '../assets/images/Group.png'
import spinWheelAnimation from '../assets/animations/spin-wheel.json'

const wheelContainer = ref(null)
let animationInstance = null

onMounted(() => {
  if (!wheelContainer.value) return
  animationInstance = lottie.loadAnimation({
    container: wheelContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: spinWheelAnimation,
  })
})

onBeforeUnmount(() => {
  if (animationInstance) {
    animationInstance.destroy()
    animationInstance = null
  }
})

const prizeItems = [
  { label: '頭獎 - iPhone 16', rate: '5%' },
  { label: '二獎 - 50 點回饋', rate: '15%' },
  { label: '未中獎', rate: '80%' },
]
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="幸運大轉盤" />

    <section class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <p class="text-[14px] font-medium text-[#FFFFFF]">今日剩餘 2 次</p>
        <div ref="wheelContainer" class="mt-1 h-[239px] w-[225px]"></div>
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
      >
        抽獎（消耗 30 點）
      </button>

      <article
        class="relative mt-6 rounded-md bg-gradient-to-b from-white to-[rgba(166,96,163,0.08)] p-4 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
      >
        <h2 class="text-[14px] font-semibold text-[#A660A3]">獎品清單</h2>
        <ul class="mt-3 space-y-1 pr-20">
          <li
            v-for="item in prizeItems"
            :key="item.label"
            class="flex items-center gap-3 text-[12px] text-[#757575]"
          >
            <span>{{ item.label }}</span>
            <span class="text-right">{{ item.rate }}</span>
          </li>
        </ul>
        <img
          :src="giftGroupImage"
          alt="gift decoration"
          class="pointer-events-none absolute bottom-[-9px] right-5 h-24 w-24 object-contain"
        />
      </article>
    </section>
  </main>
</template>

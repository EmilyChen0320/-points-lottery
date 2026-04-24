<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lottie from 'lottie-web'
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import giftGroupImage from '../assets/images/Group.png'
import spinWheelAnimation from '../assets/animations/spin-wheel.json'

const router = useRouter()
const route = useRoute()
const wheelContainer = ref(null)
let animationInstance = null
const drawStatus = ref(route.query.status === 'result' ? 'result' : 'idle')
const drawResult = ref(route.query.result === 'lose' ? 'lose' : 'win')
const remainingCount = ref(2)
const currentPoints = ref(350)
const drawCost = 30

onMounted(() => {
  if (!wheelContainer.value) return
  animationInstance = lottie.loadAnimation({
    container: wheelContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: spinWheelAnimation,
  })

  // 避免 Lottie 背景白框顯示
  wheelContainer.value.style.background = 'transparent'
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

const resultTitle = computed(() => (drawResult.value === 'win' ? '恭喜中獎！' : '很可惜，未中獎'))

const resultChipText = computed(
  () => `已扣除 ${drawCost} 點，剩餘 ${currentPoints.value - drawCost} 點`,
)

const handleDraw = () => {
  if (remainingCount.value <= 0) return
  remainingCount.value -= 1
  currentPoints.value -= drawCost
  // 目前以 30% 中獎率模擬
  drawResult.value = Math.random() < 0.3 ? 'win' : 'lose'
  drawStatus.value = 'result'
}

const drawAgain = () => {
  drawStatus.value = 'idle'
}

const backToRedeemHome = () => {
  router.push('/redeem')
}
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar :title="drawStatus === 'idle' ? '幸運大轉盤' : '抽獎結果'" />

    <section v-if="drawStatus === 'idle'" class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <p class="text-[14px] font-medium text-white">今日剩餘 {{ remainingCount }} 次</p>
        <div
          ref="wheelContainer"
          class="mt-1 h-[239px] w-[225px] overflow-hidden rounded-full bg-transparent [&_svg]:!bg-transparent"
          style="clip-path: circle(42% at 50% 50%)"
        ></div>
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-md bg-[#A660A3] py-3 text-[17px] font-bold text-white"
        @click="handleDraw"
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

    <section v-else class="px-4 pb-6 pt-8">
      <div class="flex flex-col items-center">
        <div class="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-white text-xl font-bold text-white">
          {{ drawResult === 'win' ? '✓' : '✕' }}
        </div>
        <h1 class="mt-3 text-[20px] font-bold text-white">{{ resultTitle }}</h1>
        <p
          class="mt-2 inline-flex items-center justify-center rounded-[24px] border border-white bg-[#A660A3] px-8 py-2 text-[14px] font-medium leading-6 text-white"
        >
          {{ resultChipText }}
        </p>
      </div>

      <article
        v-if="drawResult === 'win'"
        class="mx-auto mt-10 flex h-[212px] w-[263px] items-center justify-center rounded-[24px] border border-[#A660A3] bg-white shadow-[0_0_6px_rgba(0,0,0,0.10)]"
      >
        <div class="h-[154px] w-[154px] overflow-hidden rounded-[12px]">
          <img
            src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"
            alt="iPhone 17 Pro"
            class="h-[154px] w-[154px] rounded-[12px] object-cover"
          />
        </div>
      </article>

      <article
        v-else
        class="mt-10 flex items-center justify-center rounded-lg border border-[#A660A3] bg-white px-6 py-8 shadow-[0_0_6px_rgba(0,0,0,0.10)]"
        style="border-width: 0.2px"
      >
        <p class="text-center text-sm font-medium leading-4 text-[#757575]">
          今日剩餘{{ remainingCount }}次
        </p>
      </article>

      <section class="mt-10 space-y-4">
        <button
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

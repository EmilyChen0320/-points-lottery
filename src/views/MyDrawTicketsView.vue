<script setup>
import NavBar from '../components/layout/NavBar.vue'
import backgroundImage from '../assets/images/background.png'
import giftImage from '../assets/images/gift.png'

const pendingTickets = ['A-0004', 'A-0005', 'A-0006', 'A-0007']
const resultTickets = [
  { id: 'A-0003', status: '中獎 - 頭獎 iPhone', type: 'win' },
  { id: 'A-0002', status: '未中獎', type: 'lose' },
]
</script>

<template>
  <main
    class="mx-auto min-h-screen w-full max-w-[393px] bg-cover bg-top bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <NavBar title="" />

    <section class="px-4 pb-0 pt-4 text-white">
      <div class="relative overflow-visible px-4 py-3">
        <div>
          <p class="text-[17px] font-bold">開獎倒數 🎊</p>
          <div class="mt-2 flex items-center gap-2">
            <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">22</div>
            <span class="text-xs">天</span>
            <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">08</div>
            <span class="text-xs">小時</span>
            <div class="rounded-sm bg-[rgba(255,255,255,0.16)] px-2 py-1 text-sm font-semibold">42</div>
            <span class="text-xs">分</span>
          </div>
        </div>
        <img
          :src="giftImage"
          alt="gift"
          class="pointer-events-none absolute right-1 -bottom-8 h-28 w-28 -translate-x-2 object-contain"
        />
      </div>
    </section>

    <section class="mt-4 rounded-t-[32px] bg-white px-4 pb-6 pt-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-[#495057]">年中大抽獎</h2>
        <p class="text-xs text-[#757575]">持有 4 張抽獎券</p>
      </div>

      <div class="mt-3 space-y-2">
        <article
          v-for="ticket in pendingTickets"
          :key="ticket"
          class="flex items-center justify-between rounded-md border border-[#E8E8E8] bg-white px-3 py-3"
          style="border-width:0.5px"
        >
          <div>
            <p class="text-sm font-medium text-[#495057]"># {{ ticket }}</p>
            <p class="text-xs text-[#757575]">待開獎</p>
          </div>
          <span class="rounded-sm bg-[rgba(166,96,163,0.06)] px-3 py-1 text-xs text-[#A660A3]">待開獎</span>
        </article>
      </div>

      <div class="mx-[-16px] my-4 border-y border-[#009734] bg-[#ECFAE8] py-2 text-center text-xs font-semibold text-[#009734]">
        已開獎票券 🎉
      </div>

      <div class="space-y-2">
        <article
          v-for="ticket in resultTickets"
          :key="ticket.id"
          class="flex items-center justify-between rounded-md px-3 py-3"
          :class="
            ticket.type === 'win'
              ? 'border border-[#F49F25] bg-[#FFF8F1]'
              : 'border border-[#E8E8E8] bg-[#F5F5F5]'
          "
          style="border-width:0.5px"
        >
          <div>
            <p class="text-sm font-medium text-[#495057]"># {{ ticket.id }}</p>
            <p class="text-xs text-[#757575]">{{ ticket.status }}</p>
          </div>
          <span
            v-if="ticket.type === 'win'"
            class="rounded-sm bg-[#F49F25] px-3 py-1 text-xs text-white"
          >
            中獎
          </span>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'

defineProps({
  activity: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article
    class="rounded-lg border border-[#f1f1f1] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    :class="activity.status === 'ended' ? 'bg-[#f5f5f5] opacity-80' : 'bg-white'"
  >
    <div class="flex gap-3">
      <img
        :src="activity.image"
        :alt="activity.title"
        class="h-[88px] w-[88px] rounded-md object-cover"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <StatusBadge :status="activity.status" />
        <div class="flex items-center justify-between gap-2">
          <h2 class="truncate text-base font-semibold leading-6 text-text-main">{{ activity.title }}</h2>
          <p class="shrink-0 text-sm text-muted">已兌換 {{ activity.redeemedCount }} 次</p>
        </div>
        <p class="text-sm text-muted">{{ activity.period }}</p>
        <div class="mt-1 flex items-center justify-between gap-2">
          <p class="text-sm text-primary">
            我的點數: <span class="text-[17px] font-bold text-primary">{{ activity.points }} 點</span>
          </p>
          <button
            v-if="activity.status !== 'ended'"
            type="button"
            class="h-7 w-[72px] rounded-lg bg-[#A660A3] px-3 py-1 text-xs font-semibold leading-5 text-white"
          >
            前往兌換
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

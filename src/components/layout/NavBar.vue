<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <header class="flex h-12 items-center justify-between bg-primary px-4 text-white">
    <button type="button" class="w-6 text-[22px] leading-none" aria-label="返回">‹</button>
    <h1 class="text-sm font-medium leading-5">{{ title }}</h1>
    <button type="button" class="w-6 text-[20px] leading-none" aria-label="關閉">×</button>
  </header>
</template>

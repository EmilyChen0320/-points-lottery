<script setup>
const props = defineProps({
  status: {
    type: String,
    default: 'ongoing',
  },
})

const statusLabel = props.status === 'ended' ? '已結束' : '進行中'
</script>

<template>
  <span
    class="inline-flex w-fit self-start whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium"
    :class="
      status === 'ended'
        ? 'bg-[#E8E8E8] text-[#757575]'
        : 'border border-success bg-success-bg text-success'
    "
  >
    {{ statusLabel }}
  </span>
</template>

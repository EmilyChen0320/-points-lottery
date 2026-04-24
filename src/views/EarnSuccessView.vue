<script setup>
import NavBar from '../components/layout/NavBar.vue'
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-[393px] bg-primary text-white">
    <NavBar title="集點結果" />
    <section class="flex flex-col items-center px-4 pt-10">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-success">
        ✓
      </div>
      <h2 class="mt-4 text-2xl font-bold">集點成功！+1 點</h2>

      <div class="mt-6 rounded-full border border-white px-4 py-2 text-sm font-medium">
        此活動累積：35 點
      </div>

      <article class="mt-8 w-full rounded-2xl bg-white p-4 text-text-main">
        <h3 class="text-lg font-bold text-primary">母親節集點送好禮</h3>
        <p class="mt-2 text-sm text-muted">集滿 100 點可兌換好禮</p>
      </article>

      <button
        type="button"
        class="mt-8 w-full rounded-xl bg-white py-3 text-lg font-bold text-primary"
      >
        前往兌換
      </button>
    </section>
  </main>
</template>

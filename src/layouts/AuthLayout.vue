<script setup lang="ts">
import StickyTopBanner from '@/components/StickyTopBanner.vue'
</script>

<template>
  <div class="min-h-screen pt-10">
    <StickyTopBanner />
    <div class="auth-shell relative flex min-h-[calc(100vh-40px)] items-center justify-center px-4 py-10">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.auth-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.45;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a6b63' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>

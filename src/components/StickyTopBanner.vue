<script setup lang="ts">
</script>

<template>
  <div
    class="sticky-top-banner"
    role="banner"
  >
    <span>龙江银行电子档案改造演示 · HTCL-ZB-261267 · 仅供技术研究</span>
    <a
      href="https://github.com/softwarelink-net/26-lb-arc-bid"
      target="_blank"
      rel="noopener noreferrer"
    >GitHub</a>
    <a
      href="https://26-lb-arc-bid.softwarelink.net/"
      target="_blank"
      rel="noopener noreferrer"
    >线上站点</a>
  </div>
</template>

<style scoped>
.sticky-top-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background-color: #1a1a1a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 4px;
  flex-wrap: wrap;
  padding: 0 12px;
}

.sticky-top-banner a {
  color: #4fc08d;
  text-decoration: none;
  margin-left: 8px;
}

.sticky-top-banner a:hover {
  text-decoration: underline;
}
</style>

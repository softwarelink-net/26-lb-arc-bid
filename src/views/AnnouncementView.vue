<script setup lang="ts">
const points = [
  '5 个模块适配开发',
  '系统文件批量上传、分片上传功能改造',
  '全量历史档案存量数据迁移、数据校验、格式统一',
  '6 个批量接口与 8 个文件接口开发联调',
  '报表改造 66 个（字段更新与逻辑优化）',
  '单元 / 集成 / 压力测试及版本上线支持',
  '预估工作量不少于 12 人月',
  '预算约 28.8 万元',
]
</script>

<template>
  <article class="mx-auto max-w-3xl space-y-6 rounded-2xl border border-teal/10 bg-white/85 p-6 shadow-sm md:p-8">
    <header>
      <p class="text-xs tracking-[0.2em] text-teal uppercase">Public Bidding Summary</p>
      <h1 class="mt-2 text-2xl font-semibold leading-snug text-ink">
        龙江银行新一代核心系统建设项目-电子档案系统改造人力外包服务采购项目（四次）公开招标公告
      </h1>
      <dl class="mt-4 grid gap-2 text-sm text-ink/65 sm:grid-cols-2">
        <div><dt class="inline text-ink/40">采购人：</dt><dd class="inline">龙江银行股份有限公司</dd></div>
        <div><dt class="inline text-ink/40">项目编号：</dt><dd class="inline">HTCL-ZB-261267</dd></div>
        <div><dt class="inline text-ink/40">发布日期：</dt><dd class="inline">2026-09-03</dd></div>
        <div><dt class="inline text-ink/40">关键词：</dt><dd class="inline">电子档案 / 人力外包 / 核心配套</dd></div>
      </dl>
    </header>

    <section>
      <h2 class="text-sm font-semibold text-ink">摘要</h2>
      <p class="mt-2 text-sm leading-relaxed text-ink/70">
        龙江银行发布新一代核心系统建设项目-电子档案系统改造人力外包服务采购项目（四次）公开招标公告，预算 28.8 万元，涉及 5 个模块适配及历史数据迁移。改造须在现有技术架构内完成，不得部署新平台。
      </p>
    </section>

    <section>
      <h2 class="text-sm font-semibold text-ink">技术要点</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-for="p in points"
          :key="p"
          class="flex gap-2 rounded-lg bg-mint/50 px-3 py-2 text-sm text-ink/75"
        >
          <span class="text-teal">▹</span>
          {{ p }}
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-amber/30 bg-amber/5 p-4 text-xs leading-relaxed text-ink/60">
      <p class="font-semibold text-amber">免责声明（节选）</p>
      <p class="mt-2">
        本演示数据来源于互联网公开招标信息，内容由大模型基于公开信息推演生成，仅供技术研究与学习参考，不构成对任何第三方文档的引用或复制。使用本项目代码与生成内容的后果由使用者自行承担。
      </p>
    </section>
  </article>
</template>

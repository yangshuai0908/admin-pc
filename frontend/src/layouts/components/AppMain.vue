<template>
    <el-main class="layout-main">
        <router-view />
    </el-main>
</template>

<style scoped>
.layout-main {
    padding: 20px;
    background-color: var(--page-bg);
    min-height: calc(100vh - 60px);
}
</style>

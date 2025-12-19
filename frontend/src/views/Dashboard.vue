<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// 检查仪表盘访问权限
if (!userStore.hasPermission('dashboard:view')) {
  ElMessage.error('无仪表盘访问权限')
}

const chartRef = ref(null)

onMounted(() => {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    title: {
      text: '示例统计图',
    },
    tooltip: {},
    xAxis: {
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    yAxis: {},
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110, 130],
      },
    ],
  })
})
</script>

<template>
  <div class="dashboard">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📊 仪表盘</span>
        </div>
      </template>
      <div ref="chartRef" style="height: 360px"></div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>





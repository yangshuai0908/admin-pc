<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

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
  <div>
    <el-card>
      <template #header>
        <span>仪表盘</span>
      </template>
      <div ref="chartRef" style="height: 360px"></div>
    </el-card>
  </div>
</template>



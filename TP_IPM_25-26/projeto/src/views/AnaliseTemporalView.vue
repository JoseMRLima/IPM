<template>
  <div class="dashboard-wrapper">
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="content">
      <header class="topbar">
        <button class="menu-btn" @click="toggleSidebar">☰</button>
      </header>

      <section class="dashboard-content">
        
        <h2 class="title">Análise Temporal</h2>
        
        <div v-if="loading" class="loading-state">
          <p>A carregar e processar dados...</p>
        </div>

        <div v-else>
          <div class="filter-card">
            <h3>Filtro Avançado</h3>

            <div class="filters-grid">
              <div class="filter-group">
                <label>Cidade</label>
                <select v-model="filters.city">
                  <option value="Todas">Todas</option>
                  <option v-for="city in availableCities" :key="city" :value="city">
                    {{ city }}
                  </option>
                </select>
              </div>

              <div class="filter-group">
                <label>Tipo de prop.</label>
                <select v-model="filters.type">
                  <option value="Todas">Todas</option>
                  <option value="Entire home/apt">Casa/Apartamento</option>
                  <option value="Private room">Quarto Privado</option>
                  <option value="Shared room">Quarto Partilhado</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Período</label>
                <select v-model="filters.period">
                  <option value="6m">Últimos 6 meses (Real)</option>
                  <option value="1y">Último ano (Projetado)</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Faixa de Preço</label>
                <select v-model="filters.priceRange">
                  <option value="Todas">Todas</option>
                  <option value="low">&lt; 80€</option>
                  <option value="mid">80€ - 150€</option>
                  <option value="high">&gt; 150€</option>
                </select>
              </div>
            </div>

            <div class="metrics-row">
              <span class="metrics-label">Métricas:</span>
              <div class="checkbox-group">
                <label><input type="checkbox" v-model="visibleMetrics.listings" /> Listagens</label>
                <label><input type="checkbox" v-model="visibleMetrics.price" /> Preço Médio</label>
                <label><input type="checkbox" v-model="visibleMetrics.occupancy" /> Ocupação</label>
              </div>
            </div>
          </div>

          <div class="chart-section-card">
            <div class="chart-header">
              <div class="header-left">
                <h3>Evolução Temporal</h3>
                <p>Dados filtrados: {{ filteredCount.toLocaleString() }} propriedades analisadas.</p>
              </div>
            </div>

            <div class="chart-container">
              <Line
                :key="chartKey"
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </div>

          <div class="bottom-kpis">
            <div class="mini-kpi">
              <p class="mini-label">Crescimento (Periodo)</p>
              <p class="mini-value" :class="kpis.growth >= 0 ? 'text-green' : 'text-red'">
                {{ kpis.growth > 0 ? '+' : '' }}{{ kpis.growth }}%
              </p>
              <p class="mini-sub">Variação calculada</p>
            </div>
            <div class="mini-kpi">
              <p class="mini-label">Preço Atual (Média)</p>
              <p class="mini-value">{{ kpis.currentPrice }}€</p>
              <p class="mini-sub">No conjunto filtrado</p>
            </div>
            <div class="mini-kpi">
              <p class="mini-label">Ocupação Atual</p>
              <p class="mini-value">{{ kpis.currentOccupancy }}%</p>
              <p class="mini-sub">Taxa estimada</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Line } from 'vue-chartjs'
import Sidebar from '../components/Sidebar.vue'
import { exportToCSV, exportToJSON, chartDataToRows } from '../utils/export.js'

// --- ESTADO ---
const sidebarOpen = ref(false)
const loading = ref(true)
const chartKey = ref(0)

// Dados Raw da Base de Dados
const rawListings = ref([])
const rawStats = ref([]) 

// Filtros Ativos
const filters = ref({
  city: 'Todas',
  type: 'Todas',
  period: '6m',
  priceRange: 'Todas'
})

// Métricas Visíveis
const visibleMetrics = ref({
  listings: true,
  price: false,
  occupancy: false
})

// KPIs Computados
const kpis = ref({ growth: 0, currentPrice: 0, currentOccupancy: 0 })

// Dados Disponíveis para Dropdowns
const availableCities = computed(() => {
  return [...new Set(rawListings.value.map(i => i.city))].sort()
})

const filteredCount = ref(0)

//Gráfico config
const chartData = ref({ labels: [], datasets: [] })
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw)}`
      }
    }
  },
  scales: {
    y: { grid: { borderDash: [5, 5], color: '#eee' }, beginAtZero: false },
    x: { grid: { display: false } }
  }
}

//Lógica Principal

//Carregar Dados Reais
onMounted(async () => {
  try {
    const [resListings, resStats] = await Promise.all([
      fetch('http://localhost:3000/listings'),
      fetch('http://localhost:3000/stats')
    ])
    
    rawListings.value = await resListings.json()
    rawStats.value = await resStats.json()
    
    processChartData() 
    loading.value = false
  } catch (e) {
    console.error("Erro ao carregar dados:", e)
    loading.value = false
  }
})

//Processar Dados quando Filtros Mudam
watch([filters, visibleMetrics], () => {
  processChartData()
}, { deep: true })

function processChartData() {
  let currentData = rawListings.value

  // Filtro Cidade
  if (filters.value.city !== 'Todas') {
    currentData = currentData.filter(i => i.city === filters.value.city)
  }
  // Filtro Tipo
  if (filters.value.type !== 'Todas') {
    currentData = currentData.filter(i => i.room_type === filters.value.type)
  }
  // Filtro Preço
  if (filters.value.priceRange !== 'Todas') {
    if (filters.value.priceRange === 'low') currentData = currentData.filter(i => i.price < 80)
    if (filters.value.priceRange === 'mid') currentData = currentData.filter(i => i.price >= 80 && i.price <= 150)
    if (filters.value.priceRange === 'high') currentData = currentData.filter(i => i.price > 150)
  }

  filteredCount.value = currentData.length

  const currentCount = currentData.length
  
  // Preço Médio
  const priceSum = currentData.reduce((acc, i) => acc + (i.price || 0), 0)
  const currentPrice = currentCount > 0 ? Math.round(priceSum / currentCount) : 0
  
  // Ocupação Média
  const availSum = currentData.reduce((acc, i) => acc + (i.availability_365 || 0), 0)
  const avgAvail = currentCount > 0 ? availSum / currentCount : 0
  const currentOccupancy = Math.round(((365 - avgAvail) / 365) * 100)

  let historyStats = { count: 0, price: 0, occupancy: 0 }
  
  // Buscar stats da cidade selecionada (ou somar todas se 'Todas')
  const relevantStats = rawStats.value.filter(s => 
    filters.value.city === 'Todas' || s.city === filters.value.city
  )

  // Somatório dos dados históricos brutos das cidades selecionadas
  const rawHistoryTotal = relevantStats.reduce((acc, s) => acc + s.history.count, 0)
  const rawCurrentTotal = relevantStats.reduce((acc, s) => acc + s.current.count, 0)

  const filterRatio = rawCurrentTotal > 0 ? (currentCount / rawCurrentTotal) : 0

  const historyCount = Math.round(rawHistoryTotal * filterRatio)
  
  const avgHistoryPriceCity = relevantStats.length > 0 
    ? relevantStats.reduce((acc, s) => acc + s.history.price, 0) / relevantStats.length 
    : 0
  const avgCurrentPriceCity = relevantStats.length > 0 
    ? relevantStats.reduce((acc, s) => acc + s.current.price, 0) / relevantStats.length 
    : 0
  
  // Variação de preço da cidade
  const priceTrend = avgCurrentPriceCity > 0 ? avgHistoryPriceCity / avgCurrentPriceCity : 1
  const historyPrice = Math.round(currentPrice * priceTrend)

  // Variação de ocupação
  const historyOccupancy = Math.round(currentOccupancy * 0.95)

  const months6 = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set']
  const months12 = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set']
  
  const labels = filters.value.period === '6m' ? months6 : months12
  const steps = labels.length - 1

  // Arrays de Dados
  const dataListings = interpolate(historyCount, currentCount, steps)
  const dataPrice = interpolate(historyPrice, currentPrice, steps)
  const dataOccupancy = interpolate(historyOccupancy, currentOccupancy, steps)

  // Atualizar KPIs Rodapé
  kpis.value.currentPrice = currentPrice
  kpis.value.currentOccupancy = currentOccupancy
  kpis.value.growth = historyCount > 0 
    ? (((currentCount - historyCount) / historyCount) * 100).toFixed(1) 
    : 0

  // Configurar Datasets
  const datasets = []
  if (visibleMetrics.value.listings) {
    datasets.push({
      label: 'Listagens',
      data: dataListings,
      borderColor: '#0A1733',
      backgroundColor: '#0A1733',
      tension: 0.4
    })
  }
  if (visibleMetrics.value.price) {
    datasets.push({
      label: 'Preço (€)',
      data: dataPrice,
      borderColor: '#e67e22',
      backgroundColor: '#e67e22',
      tension: 0.4
    })
  }
  if (visibleMetrics.value.occupancy) {
    datasets.push({
      label: 'Ocupação (%)',
      data: dataOccupancy,
      borderColor: '#2ecc71',
      backgroundColor: '#2ecc71',
      tension: 0.4
    })
  }

  chartData.value = { labels, datasets }
  chartKey.value++
}

function interpolate(start, end, steps) {
  const arr = []
  const stepVal = (end - start) / steps
  for (let i = 0; i <= steps; i++) {
    let noise = (Math.random() - 0.5) * (stepVal * 0.5) 
    if (i === 0 || i === steps) noise = 0
    arr.push(Math.round(start + (stepVal * i) + noise))
  }
  return arr
}

// UI
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false
</script>

<style scoped>

.dashboard-wrapper { display: flex; margin-top: 60px; min-height: calc(100vh - 60px); background: #fdfdfd; font-family: 'Inter', sans-serif; }
.content { flex: 1; padding: 50px; min-width: 0; }

/* Topbar */
.topbar { display: flex; align-items: center; margin-bottom: 30px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; }

/* Título */
.title { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 20px; }

/* Filtros */
.filter-card {
  border: 1px solid #000;
  border-radius: 8px;
  padding: 25px;
  background: white;
  margin-bottom: 30px;
}
.filter-card h3 { margin: 0 0 20px 0; font-size: 18px; font-weight: 700; }

.filters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
.filter-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.filter-group select {
  width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: white; font-size: 14px;
}

.metrics-row { display: flex; align-items: center; gap: 20px; border-top: 1px solid #eee; padding-top: 20px; }
.metrics-label { font-weight: 700; font-size: 13px; }
.checkbox-group { display: flex; gap: 25px; }
.checkbox-group label { font-size: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; color: #555; }
.checkbox-group input { accent-color: #000; width: 16px; height: 16px; }

/* Gráfico */
.chart-section-card {
  border: 1px solid #000;
  border-radius: 8px;
  padding: 30px;
  background: white;
  margin-bottom: 40px;
  height: 500px;
  display: flex;
  flex-direction: column;
}
.chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.chart-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
.chart-header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
.export-actions { display: flex; gap: 15px; }
.btn-text { background: none; border: none; font-size: 13px; font-weight: 600; color: #666; cursor: pointer; }
.btn-text:hover { color: #000; text-decoration: underline; }
.chart-container { flex: 1; position: relative; }

/* KPIs */
.bottom-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
.mini-kpi { border: 1px solid #ccc; border-radius: 8px; padding: 20px; background: white; }
.mini-label { font-size: 12px; font-weight: 700; margin: 0 0 10px 0; color: #333; }
.mini-value { font-size: 28px; font-weight: 800; margin: 0; color: #000; }
.mini-sub { font-size: 12px; color: #888; margin: 5px 0 0 0; }
.text-green { color: #2ecc71; }
.text-red { color: #e74c3c; }

</style>
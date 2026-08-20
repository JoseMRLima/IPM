<template>
  <div class="dashboard-wrapper">
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="content">
      <header class="topbar">
        <button class="menu-btn" @click="toggleSidebar">☰</button>
        </header>

      <section class="dashboard-content">
        <h2 class="title">Visão Geral do Impacto</h2>

        <div class="export-row">
          <button class="export-btn" @click="exportCSV">Exportar CSV</button>
          <button class="export-btn" @click="exportJSON">Exportar JSON</button>
        </div>

        <div class="kpis-grid">
          <div class="kpi-card">
            <p class="kpi-label">Residentes Deslocados (Est.)</p>
            <p class="kpi-value">~{{ Math.round(kpis.totalListings * 0.8).toLocaleString() }}</p>
            <p class="kpi-info">Baseado em listagens de casa inteira</p>
          </div>

          <div class="kpi-card">
            <p class="kpi-label">Total de listagens</p>
            <p class="kpi-value">{{ kpis.totalListings ? kpis.totalListings.toLocaleString() : '...' }}</p>
            <p class="kpi-info">Em todas as cidades monitorizadas</p>
          </div>

          <div class="kpi-card">
            <p class="kpi-label">Áreas críticas</p>
            <p class="kpi-value">{{ kpis.criticalAreas }}</p>
            <p class="kpi-info">Bairros com >50% de ocupação AL</p>
          </div>

          <div class="kpi-card">
            <p class="kpi-label">Preço Médio Global</p>
            <p class="kpi-value">{{ kpis.avgPrice }}€</p>
            <p class="kpi-info">Média por noite</p>
          </div>
        </div>

        <div class="tabs">
          <button :class="{ active: tab === 'comparacao' }" @click="tab = 'comparacao'">
            🏙️ Comparação entre Cidades
          </button>
          <button :class="{ active: tab === 'evolucao' }" @click="tab = 'evolucao'">
            📅 Evolução (Ano Anterior)
          </button>
          <button :class="{ active: tab === 'impacto' }" @click="tab = 'impacto'">
            ⚠️ Impacto Social
          </button>
        </div>

        <div v-if="tab === 'comparacao'" class="tab-content">
          <div class="charts-row">
            <div class="chart-card">
              <h3>Preço Médio por Cidade (€)</h3>
              <div class="chart-container">
                <Bar v-if="!loading" :data="priceChartData" :options="baseOptions" />
              </div>
            </div>
            <div class="chart-card">
              <h3>Crescimento de Oferta (%)</h3>
              <div class="chart-container">
                <Bar v-if="!loading" :data="growthChartData" :options="baseOptions" />
              </div>
            </div>
          </div>

          <div class="data-card">
            <h3>Dados Comparativos</h3>
            <p>Métricas principais por cidade</p>
            <div v-if="loading">A carregar dados...</div>
            <div v-else class="city-grid">
              <div v-for="city in citiesData" :key="city.name" class="city-item">
                <div class="city-item-header">
                  <h4>{{ city.name }}</h4>
                  <span class="badge">{{ city.listagens.toLocaleString() }} ALs</span>
                </div>
                <div class="city-stats-row">
                  <p>Crescimento: <span :class="getGrowthClass(city.crescimento)">{{ city.crescimento }}</span></p>
                  <p>Preço: <strong>{{ city.preco }}€</strong></p>
                  <p>Ocupação: <strong>{{ city.ocupacao }}%</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tab === 'evolucao'" class="tab-content">
          <div class="chart-card full-width">
            <h3>Comparativo: Ano Passado vs Ano Atual</h3>
            <p>Evolução do número de listagens baseada na taxa de crescimento registada.</p>
            <div class="chart-container large">
              <Bar v-if="!loading" :data="evolutionChartData" :options="baseOptions" />
            </div>
          </div>
        </div>

        <div v-if="tab === 'impacto'" class="tab-content">
          <div class="impact-grid">
            <div class="chart-card">
              <h3>Distribuição do Alojamento</h3>
              <div class="chart-container">
                <Doughnut
                  v-if="!loading"
                  :data="impactChartData"
                  :options="doughnutOptions"
                />
              </div>
            </div>

            <div class="insights-card">
              <h3>🚨 Análise de Pressão</h3>
              <p class="subtitle-text">Cidades onde o AL coloca maior pressão na habitação:</p>
              
              <div class="pressure-list">
                <div v-for="city in highPressureCities" :key="city.name" class="pressure-item">
                  <div class="pressure-header">
                    <strong>{{ city.name }}</strong>
                    <span class="tag-red">Alta Pressão</span>
                  </div>
                  <div class="pressure-bar">
                    <div class="fill" :style="{ width: city.ocupacao + '%' }"></div>
                  </div>
                  <small>{{ city.ocupacao }}% de taxa de ocupação média</small>
                </div>
              </div>

              <div class="summary-box">
                <p><strong>{{ Math.round(kpis.totalListings * 0.4).toLocaleString() }}</strong> casas inteiras foram retiradas do mercado de arrendamento tradicional para turismo.</p>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import Sidebar from '../components/Sidebar.vue'
import { getDashboardStats } from '../services/dashboardService.js'
import { exportToCSV, exportToJSON } from '../utils/export.js'

const sidebarOpen = ref(false)
const tab = ref('comparacao')
const loading = ref(true)

const citiesData = ref([])
const kpis = ref({
  totalListings: 0,
  avgPrice: 0,
  criticalAreas: 0
})

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right' } }
}

const priceChartData = ref({ labels: [], datasets: [] })
const growthChartData = ref({ labels: [], datasets: [] })
const evolutionChartData = ref({ labels: [], datasets: [] })
const impactChartData = ref({ labels: [], datasets: [] })

const highPressureCities = computed(() => {
  return citiesData.value
    .filter(c => c.ocupacao > 60)
    .sort((a, b) => b.ocupacao - a.ocupacao)
})

const getGrowthClass = (val) => {
  if (!val) return ''
  return val.includes('+') ? 'text-green' : 'text-red'
}

onMounted(async () => {
  const data = await getDashboardStats()

  citiesData.value = data.citiesData
  kpis.value = data.kpis

  const labels = data.citiesData.map(c => c.name)

  priceChartData.value = {
    labels,
    datasets: [{
      label: 'Preço Médio (€)',
      data: data.citiesData.map(c => c.preco),
      backgroundColor: '#3498db',
      borderRadius: 4
    }]
  }

  growthChartData.value = {
    labels,
    datasets: [{
      label: 'Crescimento (%)',
      data: data.citiesData.map(c => parseFloat(c.crescimento) || 0),
      backgroundColor: '#2ecc71',
      borderRadius: 4
    }]
  }

  const currentValues = data.citiesData.map(c => c.listagens)
  const previousValues = data.citiesData.map((c, i) => {
    const growth = parseFloat(c.crescimento) || 0
    return Math.round(c.listagens / (1 + growth / 100))
  })

  evolutionChartData.value = {
    labels,
    datasets: [
      {
        label: 'Ano Anterior (Est.)',
        data: previousValues,
        backgroundColor: '#95a5a6',
        borderRadius: 4
      },
      {
        label: 'Ano Atual',
        data: currentValues,
        backgroundColor: '#0A1733',
        borderRadius: 4
      }
    ]
  }

  const total = data.kpis.totalListings
  const converted = Math.round(total * 0.42)
  const rooms = Math.round(total * 0.35)
  const compliant = total - converted - rooms

  impactChartData.value = {
    labels: ['Habitação Convertida (Investimento)', 'Quartos/Partilha', 'Habitação Ocasional'],
    datasets: [{
      data: [converted, rooms, compliant],
      backgroundColor: ['#e74c3c', '#f1c40f', '#2ecc71'],
      borderWidth: 0
    }]
  }

  loading.value = false
})

const exportCSV = () => exportToCSV(citiesData.value, 'home_cidades.csv')
const exportJSON = () => exportToJSON({ kpis: kpis.value, citiesData: citiesData.value }, 'home_dados.json')

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false
</script>

<style scoped>

.dashboard-wrapper { 
  display: flex; 
  margin-top: 60px; 
  min-height: calc(100vh - 60px); 
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.content { 
  flex: 1; 
  padding: 50px; 
  min-width: 0; 
  overflow-y: auto; 
}

.topbar { display: flex; align-items: center; margin-bottom: 30px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; }


.title { font-size: 28px; font-weight: 700; color: #333; margin-bottom: 20px; }

.export-row { margin-bottom: 20px; display: flex; gap: 10px; }
.export-btn { padding: 8px 16px; background: white; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.export-btn:hover { background: #eee; transform: translateY(-1px); }

.kpis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
.kpi-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 4px solid #0A1733; }
.kpi-label { font-size: 13px; color: #666; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 28px; font-weight: 800; color: #2c3e50; margin-bottom: 5px; }
.kpi-info { font-size: 12px; color: #999; }

.tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
.tabs button { padding: 10px 20px; border: none; background: none; cursor: pointer; font-weight: 600; color: #666; border-radius: 6px; transition: 0.3s; }
.tabs button:hover { background: #eee; }
.tabs button.active { background: #0A1733; color: white; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.chart-card.full-width { grid-column: span 2; }
.chart-container { height: 300px; position: relative; }
.chart-container.large { height: 400px; }

.impact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.insights-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.pressure-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
.pressure-item { border-bottom: 1px solid #eee; padding-bottom: 10px; }
.pressure-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.pressure-bar { background: #eee; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 5px; }
.pressure-bar .fill { background: #e74c3c; height: 100%; }
.tag-red { background: #fcebeb; color: #e74c3c; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.summary-box { background: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; margin-top: 20px; font-size: 14px; color: #c0392b; }

.city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 15px;}
.city-item { border: 1px solid #ddd; padding: 20px; border-radius: 10px; background: #fff; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; min-height: 160px; }
.city-item:hover { transform: translateY(-3px); border-color: #0A1733; box-shadow: 0 6px 15px rgba(0,0,0,0.1);}
.city-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;  padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;}
.city-item h4 { margin: 0; font-size: 18px; font-weight: 700; color: #0A1733;}
.badge { background: #0A1733; color: white; font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 600; white-space: nowrap; }
.city-stats-row { display: flex; flex-direction: column; gap: 12px;}
.city-stats-row p { margin: 0; font-size: 14px; color: #555; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #eee; padding-bottom: 4px;}
.city-stats-row p:last-child {border-bottom: none;}
.text-green { color: #2ecc71; font-weight: bold; }
.text-red { color: #e74c3c; font-weight: bold; }

</style>
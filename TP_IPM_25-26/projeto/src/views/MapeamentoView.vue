<template>
  <div class="page-container">
    
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="dashboard-wrapper">
      <div class="content">
        <header class="topbar">
          <button class="menu-btn" @click="toggleSidebar">☰</button>
          </header>

        <section class="dashboard-content">
          
          <div class="page-header">
            <div class="header-text">
              <h2 class="title">Mapeamento por Zonas</h2>
              <p class="subtitle-text">Distribuição geográfica e análise de impacto</p>
            </div>
            
            <div class="city-selector">
              <select v-model="selectedCity" @change="calculateZones">
                <option v-for="city in availableCities" :key="city" :value="city">
                  {{ city }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <p>A carregar mapa e estatísticas...</p>
          </div>

          <div v-else class="main-map-card">
            <div class="map-section">
              <h3>Mapa de Densidade</h3>
              <div class="map-container">
                <CityMap :city="selectedCity" class="fill-map" />
              </div>
            </div>

            <div class="zones-section">
              <div class="zones-header">
                <h3>Zonas da Cidade</h3>
                <div class="sort-wrapper">
                  <label>Ordenar por:</label>
                  <select v-model="sortBy" @change="calculateZones">
                    <option value="listings">Listagens</option>
                    <option value="price">Preço Médio</option>
                    <option value="occupancy">Ocupação</option>
                  </select>
                </div>
              </div>

              <div class="zones-list">
                <div v-for="(zone, index) in currentZones" :key="zone.name" class="zone-item">
                  <div class="zone-rank">{{ index + 1 }}.</div>
                  <div class="zone-details">
                    <div class="zone-top">
                      <strong>{{ zone.name }}</strong>
                      <span :class="['badge-density', zone.densityClass]">{{ zone.density }}</span>
                    </div>
                    <div class="zone-stats">
                      <span :class="{ 'highlight': sortBy === 'listings' }">Listagens: {{ zone.listings }}</span>
                      <span :class="{ 'highlight': sortBy === 'price' }">Preço: {{ zone.price }}€</span>
                      <span :class="{ 'highlight': sortBy === 'occupancy' }">Ocupação: {{ zone.occupancy }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bottom-tabs-section">
            <div class="tabs-header">
              <button :class="{ active: activeTab === 'criticas' }" @click="activeTab = 'criticas'">Zonas Críticas</button>
              <button :class="{ active: activeTab === 'tendencias' }" @click="activeTab = 'tendencias'">Tendências</button>
              <button :class="{ active: activeTab === 'impacto' }" @click="activeTab = 'impacto'">Impacto Social</button>
            </div>

            <div class="tab-content">
              <div v-if="activeTab === 'criticas'" class="criticas-grid">
                <div class="alert-box">
                  <h4>🔴 Áreas de Saturação</h4>
                  <p>Bairros com maior concentração de AL em {{ selectedCity }}</p>
                  <div class="alert-list">
                    <div v-for="zone in topCriticalZones" :key="zone.name" class="alert-item">
                      <div class="alert-info">
                        <strong>{{ zone.name }}</strong>
                        <span>{{ zone.listings }} listagens ativas</span>
                      </div>
                      <span class="tag-alert">Crítico</span>
                    </div>
                  </div>
                </div>
                <div class="growth-box">
                  <h4>📈 Zonas Secundárias</h4>
                  <p>Próximos bairros com volume significativo</p>
                  <div class="growth-list">
                    <div v-for="zone in secondaryZones" :key="zone.name" class="growth-item">
                      <div class="growth-info">
                        <strong>{{ zone.name }}</strong>
                        <small>Densidade Média/Alta</small>
                      </div>
                      <span class="tag-growth">+{{ computedCityGrowth }}% (est.)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'tendencias'" class="tendencias-container">
                <div class="trend-card">
                  <strong>Concentração Geográfica</strong>
                  <p>{{ metrics.concentration }}% de todas as listagens de {{ selectedCity }} estão concentradas em apenas 3 bairros: {{ top3Names }}.</p>
                </div>
                <div class="trend-card">
                  <strong>Disparidade de Preços</strong>
                  <p>O bairro mais caro ({{ metrics.mostExpensiveZone }}) custa {{ metrics.maxPrice }}€/noite, o que é {{ metrics.priceGap }}% mais caro que a média.</p>
                </div>
                <div class="trend-card">
                  <strong>Tendência Anual</strong>
                  <p>A cidade regista uma variação anual de {{ computedCityGrowth > 0 ? '+' : '' }}{{ computedCityGrowth }}% no número total de alojamentos.</p>
                </div>
              </div>

              <div v-if="activeTab === 'impacto'" class="impacto-container">
                <div class="impact-item orange">
                  <div class="impact-icon">🏠</div>
                  <div class="impact-text">
                    <strong>Retirada de Habitação</strong>
                    <p>{{ metrics.entireHomePercent }}% das ofertas são apartamentos inteiros ({{ metrics.entireHomeCount }} imóveis).</p>
                  </div>
                </div>
                <div class="impact-item orange">
                  <div class="impact-icon">💰</div>
                  <div class="impact-text">
                    <strong>Inflação Turística</strong>
                    <p>Preço médio atual: {{ metrics.cityAvgPrice }}€ ({{ metrics.priceGrowth > 0 ? '+' : '' }}{{ metrics.priceGrowth }}% vs histórico).</p>
                  </div>
                </div>
                <div class="impact-item orange">
                  <div class="impact-icon">👥</div>
                  <div class="impact-text">
                    <strong>Pressão no Bairro: {{ topCriticalZones[0]?.name }}</strong>
                    <p>Este bairro suporta {{ metrics.topZoneShare }}% de toda a carga turística da cidade.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import CityMap from '../components/CityMap.vue'

const sidebarOpen = ref(false)
const loading = ref(true)
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false

const selectedCity = ref('Lisboa')
const sortBy = ref('listings')
const activeTab = ref('criticas')

const rawListings = ref([])
const rawStats = ref([]) 
const currentZones = ref([]) 

const metrics = ref({ concentration: 0, mostExpensiveZone: '', maxPrice: 0, priceGap: 0, entireHomeCount: 0, entireHomePercent: 0, cityAvgPrice: 0, priceGrowth: 0, topZoneShare: 0 })

const availableCities = computed(() => {
  if (rawListings.value.length === 0) return ['Lisboa', 'Porto']
  return [...new Set(rawListings.value.map(i => i.city))].sort()
})

const topCriticalZones = computed(() => currentZones.value.slice(0, 2))
const secondaryZones = computed(() => currentZones.value.slice(2, 5))
const top3Names = computed(() => currentZones.value.slice(0, 3).map(z => z.name).join(', '))

const computedCityGrowth = computed(() => {
  const stat = rawStats.value.find(s => s.city === selectedCity.value)
  if (stat && stat.history && stat.history.count > 0) {
    return (((stat.current.count - stat.history.count) / stat.history.count) * 100).toFixed(1)
  }
  return '0.0'
})

onMounted(async () => {
  try {
    const [resListings, resStats] = await Promise.all([ fetch('http://localhost:3000/listings'), fetch('http://localhost:3000/stats') ])
    rawListings.value = await resListings.json()
    rawStats.value = await resStats.json()
    calculateZones()
    loading.value = false
  } catch (e) { console.error("Erro:", e); loading.value = false }
})

function calculateZones() {
  if (rawListings.value.length === 0) return
  const cityListings = rawListings.value.filter(i => i.city === selectedCity.value)
  const totalListings = cityListings.length
  
  const entireHomes = cityListings.filter(i => i.room_type === 'Entire home/apt').length
  metrics.value.entireHomeCount = entireHomes
  metrics.value.entireHomePercent = totalListings > 0 ? Math.round((entireHomes / totalListings) * 100) : 0

  const neighbourhoodMap = {}
  let totalPriceSum = 0
  cityListings.forEach(item => {
    const hood = item.neighbourhood || item.neighbourhood_cleansed || 'Outras Zonas'
    if (!neighbourhoodMap[hood]) neighbourhoodMap[hood] = { count: 0, priceSum: 0, availSum: 0 }
    neighbourhoodMap[hood].count++; neighbourhoodMap[hood].priceSum += (item.price || 0); neighbourhoodMap[hood].availSum += (item.availability_365 || 0)
    totalPriceSum += (item.price || 0)
  })

  let zonesArray = Object.keys(neighbourhoodMap).map(key => {
    const data = neighbourhoodMap[key]
    return { name: key, listings: data.count, price: Math.round(data.priceSum / data.count), occupancy: Math.round(((365 - (data.availSum / data.count)) / 365) * 100) }
  })

  // Cálculos para tendências
  const zonesByCount = [...zonesArray].sort((a, b) => b.listings - a.listings)
  metrics.value.concentration = totalListings > 0 ? Math.round((zonesByCount.slice(0, 3).reduce((acc, z) => acc + z.listings, 0) / totalListings) * 100) : 0
  metrics.value.topZoneShare = totalListings > 0 ? Math.round((zonesByCount[0]?.listings / totalListings) * 100) : 0

  const zonesByPrice = [...zonesArray].sort((a, b) => b.price - a.price)
  const cityAvgPrice = totalListings > 0 ? Math.round(totalPriceSum / totalListings) : 0
  metrics.value.cityAvgPrice = cityAvgPrice
  metrics.value.mostExpensiveZone = zonesByPrice[0]?.name || 'N/A'
  metrics.value.maxPrice = zonesByPrice[0]?.price || 0
  metrics.value.priceGap = cityAvgPrice > 0 ? Math.round(((metrics.value.maxPrice - cityAvgPrice) / cityAvgPrice) * 100) : 0

  const cityStat = rawStats.value.find(s => s.city === selectedCity.value)
  if (cityStat?.history?.price > 0) metrics.value.priceGrowth = (((cityStat.current.price - cityStat.history.price) / cityStat.history.price) * 100).toFixed(1)

  // Ordenação Final
  if (sortBy.value === 'listings') zonesArray.sort((a, b) => b.listings - a.listings)
  else if (sortBy.value === 'price') zonesArray.sort((a, b) => b.price - a.price)
  else if (sortBy.value === 'occupancy') zonesArray.sort((a, b) => b.occupancy - a.occupancy)

  const maxListings = Math.max(...zonesArray.map(z => z.listings)) || 1
  currentZones.value = zonesArray.slice(0, 10).map(z => {
    let density = 'Baixa', densityClass = 'green'
    const ratio = z.listings / maxListings
    if (ratio > 0.6) { density = 'Alta'; densityClass = 'red'; } else if (ratio > 0.3) { density = 'Média'; densityClass = 'yellow'; }
    return { ...z, density, densityClass }
  })
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; min-height: 100vh; }

.dashboard-wrapper { display: flex; margin-top: 60px; min-height: calc(100vh - 60px); background: #fdfdfd; font-family: 'Inter', sans-serif; }
.content { flex: 1; padding: 50px; min-width: 0; }

.topbar { display: flex; align-items: center; margin-bottom: 20px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: 700; margin: 0; }
.subtitle-text { font-size: 14px; color: #666; margin: 5px 0 0 0; }
.city-selector select { padding: 10px 15px; border: 1px solid #000; background: white; font-size: 14px; cursor: pointer; min-width: 150px; font-weight: 600; }

.main-map-card { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; border: 1.5px solid #000; border-radius: 12px; padding: 20px; background: white; margin-bottom: 30px; height: 600px; overflow: hidden; }
.map-section { display: flex; flex-direction: column; height: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 15px; box-sizing: border-box; overflow: hidden; }
.map-section h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 700; text-align: center; }
.map-container { flex: 1; width: 100%; position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #ddd; display: flex; flex-direction: column; }
:deep(.fill-map) { flex: 1; width: 100%; height: 100%; object-fit: cover; border: none; }

.zones-section { display: flex; flex-direction: column; height: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 15px; box-sizing: border-box; overflow: hidden; }
.zones-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.zones-header h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 700; }
.sort-wrapper { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #333; }
.sort-wrapper select { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; cursor: pointer; background: #fff; }
.zones-list { overflow-y: auto; flex: 1; padding-right: 5px; }
.zone-item { border: 1px solid #000; border-radius: 6px; padding: 10px; margin-bottom: 10px; display: flex; gap: 10px; }
.zone-rank { font-weight: 700; font-size: 14px; padding-top: 2px; }
.zone-details { flex: 1; }
.zone-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.zone-top strong { font-size: 13px; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge-density { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; color: white; }
.badge-density.red { background: #e74c3c; } .badge-density.yellow { background: #f1c40f; color: black; } .badge-density.green { background: #2ecc71; }
.zone-stats { display: flex; justify-content: space-between; font-size: 10px; color: #666; flex-wrap: wrap; }
.highlight { color: #000; font-weight: 700; text-decoration: underline; }

.bottom-tabs-section { border: 1.5px solid #000; border-radius: 12px; background: white; overflow: hidden; margin-top: 30px; }
.tabs-header { display: flex; border-bottom: 1.5px solid #000; }
.tabs-header button { flex: 1; padding: 15px; background: #eee; border: none; font-weight: 700; cursor: pointer; border-right: 1px solid #ccc; }
.tabs-header button.active { background: white; color: #000; }
.tabs-header button:last-child { border-right: none; }
.tab-content { padding: 30px; }
.criticas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.alert-box h4, .growth-box h4, .tendencias-container h4, .impacto-container h4 { margin: 0 0 5px 0; font-size: 16px; font-weight: 700; }
.alert-box p, .growth-box p { font-size: 12px; color: #666; margin: 0 0 15px 0; }
.alert-item { border: 1px solid #e74c3c; border-radius: 6px; padding: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.alert-info strong { display: block; font-size: 14px; }
.alert-info span { font-size: 11px; color: #666; }
.tag-alert { background: #e74c3c; color: white; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 700; }
.growth-item { border: 1px solid #2ecc71; border-radius: 6px; padding: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
.growth-info strong { display: block; font-size: 14px; }
.growth-info small { font-size: 11px; color: #666; }
.tag-growth { background: #2ecc71; color: white; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 700; }
.tendencias-container, .impacto-container { display: flex; flex-direction: column; gap: 15px; }
.trend-card { border: 1px solid #000; border-radius: 8px; padding: 15px; }
.trend-card strong { font-size: 14px; display: block; margin-bottom: 5px; }
.trend-card p { margin: 0; font-size: 13px; color: #444; }
.impact-item { display: flex; gap: 15px; padding: 15px; border-radius: 8px; align-items: flex-start; }
.impact-item.orange { background: #fff3e0; border: 1px solid #ffb74d; }
.impact-icon { font-size: 20px; }
.impact-text strong { display: block; font-size: 14px; margin-bottom: 5px; color: #e65100; }
.impact-text p { margin: 0; font-size: 13px; color: #555; }
</style>
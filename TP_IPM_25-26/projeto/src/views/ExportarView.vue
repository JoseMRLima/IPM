<template>
  <div class="dashboard-wrapper">
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="content">
      <header class="topbar">
        <button class="menu-btn" @click="toggleSidebar">☰</button>
      </header>

      <section class="dashboard-content">
        
        <div class="page-header">
          <div class="header-text">
            <h2 class="title">Exportação de dados</h2>
            <p class="subtitle-text">Selecione o ficheiro específico que deseja descarregar</p>
          </div>

          <div class="filter-dropdown-wrapper">
            <select v-model="filterCity">
              <option value="todos">Todas as Cidades</option>
              <option v-for="city in cities" :key="city.name" :value="city.name">
                {{ city.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="export-list">
          
          <div 
            v-for="card in displayedCards" 
            :key="card.id" 
            class="export-card"
          >
            <div class="card-info">
              <h3>{{ card.name }}, {{ card.country }}</h3>
              <p class="date">{{ card.date }}</p>
            </div>
            
            <div class="card-actions">
              <div class="action-row">
                <span class="label">Exportar dados em formato csv</span>
                
                <button v-if="!card.isHistory" class="icon-btn" @click="handleExportLocal(card.name, 'csv')">
                  <div class="box-icon">CSV</div> 
                  <span class="arrow-icon">⬇</span>
                </button>

                <a v-else :href="card.externalUrl" class="icon-btn" target="_blank">
                  <div class="box-icon">CSV</div> 
                  <span class="arrow-icon">⬇</span>
                </a>
              </div>

              <div class="action-row">
                <span class="label">Exportar dados em formato json</span>
                
                <button v-if="!card.isHistory" class="icon-btn" @click="handleExportLocal(card.name, 'json')">
                  <div class="box-icon">JSON</div> 
                  <span class="arrow-icon">⬇</span>
                </button>

                <button v-else class="icon-btn disabled" disabled title="Indisponível para histórico remoto">
                  <div class="box-icon disabled">JSON</div> 
                  <span class="arrow-icon disabled">⬇</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import { exportToCSV, exportToJSON } from '../utils/export.js'

const sidebarOpen = ref(false)
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false

const filterCity = ref('todos')

const cities = ref([
  {
    name: 'Porto',
    url: 'https://data.insideairbnb.com/portugal/norte/porto/2025-09-21/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/portugal/norte/porto/2025-03-08/visualisations/listings.csv'
  },
  {
    name: 'Lisboa',
    url: 'https://data.insideairbnb.com/portugal/lisbon/lisbon/2025-09-21/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/portugal/lisbon/lisbon/2025-03-08/visualisations/listings.csv'
  },
  {
    name: 'Barcelona',
    url: 'https://data.insideairbnb.com/spain/catalonia/barcelona/2025-09-14/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/spain/catalonia/barcelona/2025-03-05/visualisations/listings.csv'
  },
  {
    name: 'Madrid',
    url: 'https://data.insideairbnb.com/spain/comunidad-de-madrid/madrid/2025-09-14/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/spain/comunidad-de-madrid/madrid/2025-03-05/visualisations/listings.csv'
  },
  {
    name: 'Londres',
    url: 'https://data.insideairbnb.com/united-kingdom/england/london/2025-09-14/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/united-kingdom/england/london/2025-03-04/visualisations/listings.csv'
  },
  {
    name: 'Paris',
    url: 'https://data.insideairbnb.com/france/ile-de-france/paris/2025-06-06/visualisations/listings.csv',
    historyUrl: 'https://data.insideairbnb.com/france/ile-de-france/paris/2025-03-03/visualisations/listings.csv'
  }
])

function getCountry(city) {
  const map = {
    'Porto': 'Portugal', 'Lisboa': 'Portugal',
    'Barcelona': 'Espanha', 'Madrid': 'Espanha',
    'Londres': 'Inglaterra', 'Paris': 'França'
  }
  return map[city] || ''
}

function formatDateFromUrl(url) {
  try {
    const match = url.match(/(\d{4}-\d{2}-\d{2})/)
    if (match) {
      const date = new Date(match[0])
      return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return 'Data desconhecida'
  } catch (e) {
    return 'Data desconhecida'
  }
}

//Cria uma lista plana com 2 cartões por cidade
const displayedCards = computed(() => {
  let result = []
  
  //Filtra as cidades
  const targetCities = filterCity.value === 'todos' 
    ? cities.value 
    : cities.value.filter(c => c.name === filterCity.value)

  //Cria os cartões duplos
  targetCities.forEach(city => {
    // Cartão Atual
    result.push({
      id: city.name + '-atual',
      name: city.name,
      country: getCountry(city.name),
      date: formatDateFromUrl(city.url),
      isHistory: false
    })
    
    // Cartão Histórico
    result.push({
      id: city.name + '-hist',
      name: city.name,
      country: getCountry(city.name),
      date: formatDateFromUrl(city.historyUrl),
      isHistory: true,
      externalUrl: city.historyUrl
    })
  })

  return result
})

async function handleExportLocal(cityName, format) {
  try {
    const response = await fetch(`http://localhost:3000/listings?city=${cityName}`)
    const data = await response.json()

    if (!data || data.length === 0) {
      alert(`Aviso: Base de dados local vazia para ${cityName}.`)
      return 
    }

    const filename = `InsideAirbnb_${cityName}_Atual_${new Date().toISOString().slice(0,10)}`
    
    if (format === 'csv') {
      exportToCSV(data, `${filename}.csv`)
    } else {
      exportToJSON(data, `${filename}.json`)
    }

  } catch (error) {
    console.error(error)
    alert("Erro ao ligar ao servidor local.")
  }
}
</script>

<style scoped>

.dashboard-wrapper { display: flex; margin-top: 60px; min-height: calc(100vh - 60px); background: #fdfdfd; font-family: 'Inter', sans-serif; }
.content { flex: 1; padding: 50px; min-width: 0; }

.topbar { display: flex; align-items: center; margin-bottom: 40px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;}
.title { font-size: 28px; font-weight: 700; margin: 0; }
.subtitle-text { font-size: 14px; color: #666; margin: 5px 0 0 0; }
.filter-dropdown-wrapper select { padding: 10px 15px; border: 1px solid #000; border-radius: 0; background: white; font-size: 14px; cursor: pointer; min-width: 200px; font-weight: 500;}

.export-list { display: grid; grid-template-columns: 1fr 1fr; gap: 25px;}

.export-card { background: white; border: 1.5px solid #000;  border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 15px;}
.card-info h3 { margin: 0; font-size: 18px; font-weight: 800; color: #000; }
.card-info .date { margin: 5px 0 0 0; font-size: 14px; color: #555; }
.card-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 10px;}
.action-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;}
.action-row:last-child { border-bottom: none; padding-bottom: 0; }
.action-row .label { font-size: 13px; color: #333; font-weight: 500;}

/* Botões */
.icon-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; padding: 0; text-decoration: none;}
.box-icon { font-size: 10px; font-weight: 800; border: 2px solid #000; border-radius: 4px; padding: 2px 5px; color: #000; text-transform: uppercase; line-height: 1;}
.arrow-icon { font-size: 18px; color: #000; font-weight: bold; line-height: 1; }
.icon-btn:hover:not(.disabled) { opacity: 0.7; }

/* Estilo Desativado */
.icon-btn.disabled { cursor: not-allowed; opacity: 0.3; }
.box-icon.disabled { border-color: #999; color: #999; }
.arrow-icon.disabled { color: #999; }

</style>
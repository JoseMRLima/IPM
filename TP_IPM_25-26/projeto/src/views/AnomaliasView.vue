<template>
  <div class="dashboard-wrapper">
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="content">
      <header class="topbar">
        <button class="menu-btn" @click="toggleSidebar">☰</button>
      </header>

      <section class="dashboard-content">
        
        <h2 class="title">Anomalias</h2>
        <p class="subtitle-text">Casos emblemáticos, dados comparativos e análise de impacto social</p>
        
        <div class="kpis-row">
          <div class="kpi-box">
            <span class="icon">🏢</span>
            <div class="kpi-info">
              <strong>Total de Listagens</strong>
              <span class="value">{{ kpis.total ? kpis.total.toLocaleString() : '...' }}</span>
              <small>Em {{ Object.keys(cityStats).length }} cidades principais</small>
            </div>
          </div>
          <div class="kpi-box">
            <span class="icon red-icon">⚠️</span>
            <div class="kpi-info">
              <strong>Áreas Críticas</strong>
              <span class="value">{{ Math.round(kpis.total / 2500) }}</span>
              <small>Zonas em situação crítica</small>
            </div>
          </div>
          <div class="kpi-box">
            <span class="icon green-icon">📈</span>
            <div class="kpi-info">
              <strong>Crescimento Médio</strong>
              <span class="value">{{ kpis.growth }}</span>
              <small>Últimos 12 meses</small>
            </div>
          </div>
          <div class="kpi-box">
            <span class="icon">🏠</span>
            <div class="kpi-info">
              <strong>Habitação Convertida</strong>
              <span class="value">{{ kpis.converted ? kpis.converted.toLocaleString() : '...' }}+</span>
              <small>Imóveis fora do mercado</small>
            </div>
          </div>
        </div>

        <div class="cities-grid">
          <div v-for="(city, index) in cities" :key="city.name" class="city-card">
            <div class="city-card-header">
              <h3>{{ index + 1 }}. {{ city.name }}</h3>
              <span :class="['badge-density', city.densityClass]">{{ city.density }}</span>
            </div>
            <div class="city-body">
              <p class="city-text">{{ city.text }}</p>
              <div class="map-wrapper">
                <CityMap :city="city.name" />
              </div>
            </div>
          </div>
        </div>

        <div class="rules-section">
          <h3>Regras de Deteção Automática</h3>
          <p class="section-sub">Critérios configurados para identificação de anomalias</p>
          
          <table class="rules-table">
            <thead>
              <tr>
                <th>Regra</th>
                <th>Critério</th>
                <th>Severidade</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ocupação Excessiva</td>
                <td>> 300 dias/ano ocupados</td>
                <td><span class="tag yellow">Médio</span></td>
                <td><span class="tag green">Ativo</span></td>
              </tr>
              <tr>
                <td>Sem Licença Municipal</td>
                <td>Não registado no sistema AL</td>
                <td><span class="tag red">Crítico</span></td>
                <td><span class="tag green">Ativo</span></td>
              </tr>
              <tr>
                <td>Host Profissional</td>
                <td>> 5 propriedades por host</td>
                <td><span class="tag yellow">Médio</span></td>
                <td><span class="tag green">Ativo</span></td>
              </tr>
              <tr>
                <td>Variação de Preço</td>
                <td>Aumento >100% em 30 dias</td>
                <td><span class="tag yellow">Médio</span></td>
                <td><span class="tag green">Ativo</span></td>
              </tr>
              <tr>
                <td>Avaliações Suspeitas</td>
                <td>>10 reviews em 7 dias</td>
                <td><span class="tag blue">Baixo</span></td>
                <td><span class="tag green">Ativo</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="alerts-section">
          <h3>Alertas Ativos</h3>
          <p class="section-sub">Anomalias detetadas que requerem atenção</p>

          <div class="filters-tabs">
            <button :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">Todos</button>
            <button :class="{ active: activeFilter === 'high' }" @click="activeFilter = 'high'">Críticos</button>
            <button :class="{ active: activeFilter === 'medium' }" @click="activeFilter = 'medium'">Médios</button>
            <button :class="{ active: activeFilter === 'low' }" @click="activeFilter = 'low'">Baixos</button>
          </div>

          <div class="alert-list">
            <div 
              v-for="alert in filteredAlerts" 
              :key="alert.id" 
              class="alert-item" 
              :class="alert.severity"
            >
              <div class="alert-icon">{{ alert.icon }}</div>
              <div class="alert-text">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-description">{{ alert.desc }}</span>
              </div>
              <div class="alert-status">
                <span class="tag-prioridade" :class="alert.severity">{{ translateSeverity(alert.severity) }}</span>
                <span class="tag-estado">Pendente</span>
                <button class="btn-detalhes" @click="verDetalhes(alert)">Ver Detalhes</button>
              </div>
            </div>

            <div v-if="filteredAlerts.length === 0" class="no-alerts">
              Não existem alertas com este nível de prioridade.
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="report-text">
            <h3>Relatório de Fiscalização</h3>
            <p>Exportar dados para ações regulatórias</p>
            <small>Gerar relatórios detalhados com todas as anomalias detetadas para submeter às autoridades competentes</small>
          </div>
          <button class="btn-black" @click="exportCSV">⬇ Gerar Relatório</button>
        </div>

        <div v-if="selectedAlert" class="modal-overlay" @click.self="selectedAlert = null">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Detalhes do Alerta</h3>
              <button class="close-btn" @click="selectedAlert = null">×</button>
            </div>
          <div class="modal-body">
          <div class="detail-row">
            <strong>Título:</strong> <span>{{ selectedAlert.title }}</span>
          </div>
          <div class="detail-row">
            <strong>Descrição:</strong> <span>{{ selectedAlert.desc }}</span>
          </div>
          <div class="detail-row">
            <strong>ID Propriedade:</strong> <span>{{ selectedAlert.id }}</span>
          </div>
          <div class="detail-row">
            <strong>Severidade:</strong> 
            <span :class="['tag-prioridade', selectedAlert.severity]">
              {{ translateSeverity(selectedAlert.severity) }}
            </span>
          </div>
          <div class="detail-row">
            <strong>Estado Atual:</strong> <span class="tag-estado">Ativo (Em Análise)</span>
          </div>
      
          <div class="modal-actions">
            <button class="btn-black" @click="selectedAlert = null">Fechar</button>
            <button class="btn-outline" @click="investigateMock">Investigar Mais</button>
          </div>
        </div>
      </div>
    </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import Sidebar from "../components/Sidebar.vue"
import CityMap from "../components/CityMap.vue"
import { getAnomaliesData } from "../services/dashboardService"
import { exportToCSV } from '../utils/export.js'

const sidebarOpen = ref(false)
const kpis = ref({})
const alerts = ref([])
const cityStats = ref({})
const activeFilter = ref('all')
const selectedAlert = ref(null)

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false

const exportCSV = () => exportToCSV(alerts.value, 'relatorio_anomalias.csv')

const translateSeverity = (sev) => {
  if(sev === 'high') return 'Crítico'
  if(sev === 'medium') return 'Médio'
  return 'Baixo'
}

const verDetalhes = (alert) => {
  selectedAlert.value = alert
}

const investigateMock = () => {
  alert('Redirecionando para página de investigação detalhada...')
  selectedAlert.value = null
}

const filteredAlerts = computed(() => {
  if (activeFilter.value === 'all') return alerts.value
  return alerts.value.filter(alert => alert.severity === activeFilter.value)
})

const cities = [
  { 
    name: "Lisboa", 
    density: "Densidade Alta", 
    densityClass: "red", 
    text: "52% dos imóveis de toda a cidade são para AL, aumentando o preço médio do arrendamento de longa duração em 58% e diminuindo a população residente em 33% nas zonas históricas." 
  },
  { 
    name: "Porto", 
    density: "Densidade Média", 
    densityClass: "yellow", 
    text: "Pressão extrema na Ribeira e Sé, onde 42% do edificado é turístico. O aumento de 25% nas rendas forçou a deslocação de famílias para a periferia de Gaia e Matosinhos." 
  },
  { 
    name: "Barcelona", 
    density: "Densidade Alta", 
    densityClass: "red", 
    text: "Apesar da regulação PEUAT, existem milhares de quartos ilegais. O preço por m² subiu 35% em 5 anos, dificultando o acesso à habitação para jovens residentes." 
  },
  { 
    name: "Madrid", 
    density: "Densidade Alta", 
    densityClass: "red", 
    text: "90% das listagens no Distrito Centro pertencem a anfitriões profissionais com múltiplas casas. A oferta de habitação permanente caiu 15% desde 2019." 
  },
  { 
    name: "Londres", 
    density: "Densidade Alta", 
    densityClass: "red", 
    text: "Violação sistemática da regra dos 90 dias em Camden e Westminster. Estima-se que 20.000 casas foram retiradas do mercado de arrendamento de longo prazo." 
  },
  { 
    name: "Paris", 
    density: "Densidade Alta", 
    densityClass: "red", 
    text: "Densidade extrema em Montmartre e Marais. 1 em cada 6 apartamentos no centro é AL, violando frequentemente o limite legal de 120 dias anuais." 
  }
]

onMounted(async () => {
  const data = await getAnomaliesData()
  kpis.value = data.kpis
  alerts.value = data.alerts
  cityStats.value = data.cityStats
})
</script>

<style scoped>

.dashboard-wrapper { 
  display: flex; 
  margin-top: 60px; 
  min-height: calc(100vh - 60px); 
  background: #fdfdfd; 
  font-family: 'Inter', sans-serif;
}

.content { 
  flex: 1; 
  padding: 50px; 
  min-width: 0; 
  overflow-y: auto; 
}

/* Topbar só com botão */
.topbar { display: flex; align-items: center; margin-bottom: 30px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; }

/* Título Solto */
.title { font-size: 28px; font-weight: 700; margin: 0; color: #333; }
.subtitle-text { margin: 5px 0 30px 0; color: #666; font-size: 14px; }

/* KPIs ROW */
.kpis-row { display: flex; gap: 20px; margin-bottom: 40px; }
.kpi-box { 
  flex: 1; border: 1.5px solid #000; border-radius: 8px; padding: 20px; display: flex; gap: 15px; align-items: center; background: white;
}
.kpi-info { display: flex; flex-direction: column; }
.kpi-info strong { font-size: 14px; font-weight: 700; color: #333; }
.kpi-info .value { font-size: 26px; font-weight: 800; margin: 4px 0; }
.kpi-info small { font-size: 12px; color: #666; line-height: 1.3; }
.icon { font-size: 28px; }
.red-icon { color: #e74c3c; } .green-icon { color: #2ecc71; }

/* Grid de Cidades */
.cities-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 20px; 
  margin-bottom: 40px; 
}

.city-card { border: 1.5px solid #000; border-radius: 12px; background: white; padding: 20px; display: flex; flex-direction: column; }
.city-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.city-card-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
.badge-density { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; color: white; }
.badge-density.red { background: #ff0000; } .badge-density.yellow { background: #f1c40f; color: black; }

.city-text { font-size: 13px; margin-bottom: 15px; color: #444; line-height: 1.5; min-height: 70px; }
.map-wrapper { height: 140px; border-radius: 6px; overflow: hidden; border: 1px solid #ccc; }

/* Tabela de Regras */
.rules-section { border: 1.5px solid #000; border-radius: 12px; background: white; padding: 25px; margin-bottom: 40px; }
.section-sub { font-size: 14px; color: #666; margin-bottom: 20px; }
.rules-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.rules-table th { text-align: left; padding: 12px; border-bottom: 2px solid #000; font-weight: 700; }
.rules-table td { padding: 12px; border-bottom: 1px solid #eee; }
.tag { padding: 4px 10px; border-radius: 15px; font-weight: 600; font-size: 12px; }
.tag.yellow { background: #fff3cd; color: #856404; }
.tag.red { background: #f8d7da; color: #721c24; }
.tag.blue { background: #d1ecf1; color: #0c5460; }
.tag.green { background: #d4edda; color: #155724; }

/* Alertas */
.alerts-section { border: 1.5px solid #000; border-radius: 12px; background: white; padding: 25px; margin-bottom: 40px; }
.filters-tabs { display: flex; gap: 10px; margin-bottom: 25px; background: #eee; padding: 5px; border-radius: 8px; display: inline-flex; }
.filters-tabs button { border: none; background: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; color: #555; transition: 0.2s; }
.filters-tabs button:hover { background: #e0e0e0; }
.filters-tabs button.active { background: white; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

.alert-list { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.no-alerts { grid-column: span 2; text-align: center; padding: 20px; color: #666; font-style: italic; }

.alert-item { display: flex; align-items: flex-start; padding: 15px; border: 1px solid #000; border-radius: 8px; background: #fff; transition: transform 0.2s; }
.alert-item:hover { transform: translateY(-2px); }
.alert-item.high { border-left: 6px solid #e74c3c; }
.alert-item.medium { border-left: 6px solid #f1c40f; }
.alert-item.low { border-left: 6px solid #3498db; }

.alert-icon { font-size: 24px; margin-right: 15px; margin-top: 2px; }
.alert-text { flex-grow: 1; }
.alert-title { display: block; font-weight: 700; font-size: 14px; color: #333; margin-bottom: 4px; }
.alert-description { display: block; font-size: 13px; color: #666; line-height: 1.4; }

.alert-status { text-align: right; margin-left: 15px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 90px;}
.btn-detalhes { background: white; border: 1px solid #000; padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer; border-radius: 15px; transition: background 0.2s; }
.btn-detalhes:hover { background: #f0f0f0; }

.tag-prioridade { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; color: white; }
.tag-prioridade.high { background: #e74c3c; }
.tag-prioridade.medium { background: #f1c40f; color: black; }
.tag-prioridade.low { background: #3498db; }
.tag-estado { font-size: 11px; border: 1px solid #ccc; padding: 3px 8px; border-radius: 10px; background: #eee; color: #555; }

/* Relatório Footer */
.report-card { border: 1.5px solid #000; border-radius: 12px; background: white; padding: 25px; display: flex; justify-content: space-between; align-items: center; }
.report-text h3 { margin: 0 0 5px 0; font-size: 18px; font-weight: 700; }
.btn-black { background: #000; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px; }
.btn-black:hover { background: #333; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px);}
.modal-content { background: white; padding: 30px; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 1px solid #000;}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;}
.modal-header h3 { margin: 0; font-size: 20px; font-weight: 800; }
.close-btn { background: none; border: none; font-size: 28px; cursor: pointer; line-height: 1;}
.detail-row { margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px;}
.detail-row strong { font-size: 13px; color: #666; text-transform: uppercase; }
.detail-row span { font-size: 16px; color: #000; }
.modal-actions { display: flex; gap: 15px; margin-top: 30px; justify-content: flex-end;}
.btn-outline {background: white; border: 1px solid #000; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;}
.btn-outline:hover { background: #f0f0f0; }

</style>
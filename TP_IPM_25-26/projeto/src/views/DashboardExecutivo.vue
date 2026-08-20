<template>
  <div class="dashboard-wrapper">
    <Sidebar :isOpen="sidebarOpen" @close="closeSidebar" />

    <div class="content">
      <header class="topbar">
        <button class="menu-btn" @click="toggleSidebar">☰</button>
      </header>

      <div v-if="loading" class="loading-overlay">
        <p>A carregar dados de {{ selectedCity }}...</p>
      </div>

      <section v-else class="dashboard-content">
        
        <div class="page-header-exec">
          <div class="header-titles">
            <h1 class="logo-title">Dashboard Executivo</h1>
            <p class="subtitle-header">Identificação de propriedades para fiscalização e ação regulatória</p>
          </div>
          
          <div class="header-controls">
            
            <div class="city-filter-wrapper">
              <select v-model="selectedCity" class="city-select">
                <option value="Lisboa">Lisboa</option>
                <option value="Porto">Porto</option>
                <option value="Barcelona">Barcelona</option>
                <option value="Madrid">Madrid</option>
                <option value="Londres">Londres</option>
                <option value="Paris">Paris</option>
              </select>
            </div>
          </div>
        </div>

        <div class="kpis-row-exec">
          <div class="kpi-card-exec">
            <span class="kpi-label">Sem Licença</span>
            <div class="kpi-main">
              <span class="kpi-number">{{ kpis.semLicenca }}</span>
              <span class="kpi-sub">{{ kpis.semLicencaPct }}% do total</span>
            </div>
          </div>
          <div class="kpi-card-exec">
            <span class="kpi-label">+300 Dias/Ano</span>
            <div class="kpi-main">
              <span class="kpi-number">{{ kpis.ocupacaoExcessiva }}</span>
              <span class="kpi-sub">Ocupação Excessiva</span>
            </div>
          </div>
          <div class="kpi-card-exec">
            <span class="kpi-label">Em Conformidade</span>
            <div class="kpi-main">
              <span class="kpi-number">{{ kpis.emConformidade }}</span>
              <span class="kpi-sub">{{ kpis.emConformidadePct }}% do total</span>
            </div>
          </div>
          <div class="kpi-card-exec">
            <span class="kpi-label">Ação Urgente</span>
            <div class="kpi-main">
              <span class="kpi-number">{{ kpis.acaoUrgente }}</span>
              <span class="kpi-sub">Casos Prioritários</span>
            </div>
          </div>
        </div>

        <div class="alert-box-exec">
          <div class="alert-text">
            <h3>Atenção Executiva: {{ selectedCity }}</h3>
            <p>{{ kpis.acaoUrgente }} propriedades requerem ação imediata de fiscalização.</p>
            <p>{{ kpis.semLicenca }} listagens estão ativas sem licença ou registo válido detetado.</p>
          </div>
          <div class="alert-actions">
            <button class="btn-red-action" @click="generateInspectionReport">📥 Gerar Relatório de Fiscalização</button>
          </div>
        </div>

        <div class="section-container">
          <h3 class="section-title">Prioridade para Fiscalização</h3>
          <p class="section-subtitle">Listagens identificadas para ação regulatória imediata em {{ selectedCity }}</p>
          <table class="exec-table">
            <thead>
              <tr>
                <th>Morada / ID</th>
                <th>Problema</th>
                <th>Host</th>
                <th>Severidade</th>
                <th>Estado</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in priorityList" :key="idx">
                <td>{{ item.address }}</td>
                <td>{{ item.problem }}</td>
                <td>{{ item.host }}</td>
                <td><span :class="['tag-sev', item.sevClass]">{{ item.severity }}</span></td>
                <td><span :class="['tag-status', item.statusClass]">{{ item.status }}</span></td>
                <td><button class="btn-small-action" @click="openModal(item, 'Abertura de Caso')">Abrir Caso</button></td>
              </tr>
              <tr v-if="priorityList.length === 0">
                <td colspan="6" style="text-align:center; padding: 20px;">Nenhum caso crítico encontrado.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section-container">
          <h3 class="section-title">Hosts com Múltiplas Propriedades</h3>
          <p class="section-subtitle">Operadores profissionais em {{ selectedCity }} que requerem fiscalização</p>
          <table class="exec-table">
            <thead>
              <tr>
                <th>Host/Empresa</th>
                <th>Nº Propriedades</th>
                <th>Zona Principal</th>
                <th>Risco/Conformidade</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(host, idx) in multiHosts" :key="idx">
                <td>{{ host.nome }}</td>
                <td>{{ host.total }}</td>
                <td>{{ host.zona }}</td>
                <td><span :class="['tag-sev', host.confClass]">{{ host.conformidade }}</span></td>
                <td><button class="btn-small-action" @click="openModal(host, 'Investigação de Host')">Investigar</button></td>
              </tr>
              <tr v-if="multiHosts.length === 0">
                <td colspan="5" style="text-align:center; padding: 20px;">Sem hosts profissionais detetados.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bottom-stats-grid">
          <div class="section-container">
            <h3 class="section-title">Estado Geral de Conformidade</h3>
            <p class="section-subtitle">Distribuição das listagens ativas</p>
            <div class="progress-container">
              <div class="prog-row" v-for="prog in conformityStats" :key="prog.label">
                <div class="prog-labels"><span>{{ prog.label }}</span><span>{{ prog.val }}%</span></div>
                <div class="progress-bar-bg"><div :class="['progress-fill', prog.color]" :style="{width: prog.val + '%'}"></div></div>
              </div>
            </div>
          </div>

          <div class="section-container">
            <h3 class="section-title">Ações de Fiscalização</h3>
            <p class="section-subtitle">Resumo de intervenções (Simulado)</p>
            <div class="action-summary-list">
              <div class="summary-item"><span>Notificações Emitidas</span><strong>85</strong></div>
              <div class="summary-item success-border"><span>✅ Casos Resolvidos</span><strong>68</strong></div>
              <div class="summary-item"><span>Em investigação</span><strong>42</strong></div>
            </div>
          </div>
        </div>

        <div class="section-container">
          <h3 class="section-title">Relatórios de Fiscalização</h3>
          <p class="section-subtitle">Exportar dados para ações regulatórias</p>
          <div class="export-buttons-grid">
            <button class="export-btn" @click="handleReportDownload('full', 'CSV')">📥 Relatório Completo (CSV)</button>
            <button class="export-btn" @click="handleReportDownload('300', 'JSON')">📥 Listagens +300 Dias (JSON)</button>
            <button class="export-btn" @click="handleReportDownload('nolicense', 'CSV')">📥 Sem Licença (CSV)</button>
            <button class="export-btn" @click="handleReportDownload('multihost', 'CSV')">📥 Lista Multi-Hosts (CSV)</button>
          </div>
        </div>

        <div v-if="selectedItem" class="modal-overlay" @click.self="closeModal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ modalTitle }}</h3>
              <button class="close-btn" @click="closeModal">×</button>
            </div>
            <div class="modal-body">
              <p class="modal-intro">Confirme os detalhes para iniciar o processo:</p>
              <div class="detail-grid">
                <div v-if="selectedItem.address" class="detail-row">
              <strong>Alvo:</strong> <span>{{ selectedItem.address }}</span>
            </div>
            <div v-if="selectedItem.host || selectedItem.nome" class="detail-row">
              <strong>Entidade:</strong> <span>{{ selectedItem.host || selectedItem.nome }}</span>
            </div>
            <div v-if="selectedItem.problem" class="detail-row">
              <strong>Infração:</strong> <span>{{ selectedItem.problem }}</span>
            </div>
            <div v-if="selectedItem.zona" class="detail-row">
              <strong>Zona:</strong> <span>{{ selectedItem.zona }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-outline-dark" @click="closeModal">Cancelar</button>
            <button class="btn-red-action" @click="confirmAction">Confirmar Processo</button>
          </div>
        </div>
      </div>
    </div>

      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import { getExecutiveStats,  getUrgentReportData, getReportFull,  getReportHighOccupancy,  getReportNoLicense, getReportMultiHosts } from '../services/dashboardService.js'
import { exportToCSV, exportToJSON } from '../utils/export.js'

const sidebarOpen = ref(false)
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value
const closeSidebar = () => sidebarOpen.value = false

const selectedCity = ref('Lisboa')
const loading = ref(true)

const kpis = ref({})
const priorityList = ref([])
const multiHosts = ref([])
const conformityStats = ref([])
const selectedItem = ref(null)
const modalTitle = ref('')

const openModal = (item, title) => {
  selectedItem.value = item
  modalTitle.value = title
}

const closeModal = () => {
  selectedItem.value = null
}

const confirmAction = () => {
  alert(`Processo de "${modalTitle.value}" iniciado com sucesso no sistema interno.`)
  closeModal()
}

const exportCSV = () => {
  const city = selectedCity.value || 'cidade'
  exportToCSV(priorityList.value, `dashboard_${city}_prioridades.csv`)
}

const exportJSON = () => {
  const city = selectedCity.value || 'cidade'
  exportToJSON({
    city,
    kpis: kpis.value,
    priorityList: priorityList.value,
    multiHosts: multiHosts.value,
    conformityStats: conformityStats.value
  }, `dashboard_${city}_dados.json`)
}

const handleReportDownload = async (type, format) => {
  const city = selectedCity.value
  let data = []
  let filename = `Relatorio_${type}_${city}`

  try {
    if (type === 'full') {
      data = await getReportFull(city)
    } else if (type === '300') {
      data = await getReportHighOccupancy(city)
    } else if (type === 'nolicense') {
      data = await getReportNoLicense(city)
    } else if (type === 'multihost') {
      data = await getReportMultiHosts(city)
    }

    if (!data || data.length === 0) {
      alert('Sem dados para exportar nesta categoria.')
      return
    }

    if (format === 'CSV') {
      exportToCSV(data, `${filename}.csv`)
    } else {
      exportToJSON(data, `${filename}.json`)
    }
  } catch (error) {
    console.error("Erro no download:", error)
    alert("Erro ao processar o download.")
  }
}

const generateInspectionReport = async () => {
  try {
    const city = selectedCity.value
    // Vai buscar os dados específicos ao serviço
    const reportData = await getUrgentReportData(city)
    
    if (reportData && reportData.length > 0) {
      exportToCSV(reportData, `relatorio_fiscalizacao_urgente_${city.toUpperCase()}.csv`)
    } else {
      alert(`Não existem propriedades críticas registadas para ${city}.`)
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    alert("Erro ao gerar o relatório.")
  }
}

const fetchData = async (city) => {
  loading.value = true
  try {
    const data = await getExecutiveStats(city)
    if (data) {
      kpis.value = data.kpis
      priorityList.value = data.priorityList
      multiHosts.value = data.multiHosts
      conformityStats.value = data.conformityStats
    }
  } catch (e) {
    console.error("Erro ao carregar dashboard:", e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchData(selectedCity.value) })
watch(selectedCity, (newCity) => { fetchData(newCity) })

const mockDownload = (n, f) => alert(`A descarregar ${n} em formato ${f}...`)
</script>

<style scoped>

.dashboard-wrapper { display: flex; margin-top: 60px; min-height: calc(100vh - 60px); background: #fdfdfd; font-family: 'Inter', sans-serif; } 
.content { flex: 1; padding: 50px; min-width: 0; }

/*topbar */
.topbar { display: flex; align-items: center; margin-bottom: 30px; }
.menu-btn { background: #f0f0f0; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 15px; font-size: 20px; }

/* Header */
.page-header-exec {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
}

.logo-title { font-size: 32px; font-weight: 800; margin: 0; }
.subtitle-header { color: #555; margin: 5px 0 0 0; }

.header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.city-select { padding: 10px 20px; border: 1px solid #000; border-radius: 4px; font-size: 16px; min-width: 200px; cursor: pointer; }

/*Layout*/
.export-row { display: flex; gap: 10px; }
.export-btn { padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
.export-btn:hover { filter: brightness(0.98); }

.kpis-row-exec { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
.kpi-card-exec { background: white; padding: 20px; border: 1px solid #000; border-radius: 12px; }
.kpi-label { font-weight: 700; font-size: 18px; margin-bottom: 12px; display: block; }
.kpi-main { display: flex; align-items: baseline; }
.kpi-number { font-size: 36px; font-weight: 500; }
.kpi-sub { font-size: 14px; color: #666; margin-left: 12px; }

.alert-box-exec { background: #ffb4b4; border: 1px solid #000; border-radius: 12px; padding: 30px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.alert-text h3 { font-size: 32px; margin: 0 0 10px 0; font-weight: 700; }
.alert-text p { margin: 5px 0; font-size: 18px; }
.alert-actions { display: flex; gap: 15px; }
.btn-red-action { background: #ff0000; color: white; border: none; padding: 15px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-outline-dark { background: white; border: 1px solid #000; padding: 15px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; }

.section-container { background: white; border: 1px solid #000; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
.section-title { font-size: 24px; font-weight: 800; margin: 0; }
.section-subtitle { color: #666; margin: 5px 0 20px 0; font-size: 16px; }

.exec-table { width: 100%; border-collapse: collapse; }
.exec-table th { text-align: left; padding: 12px; border-bottom: 2px solid #000; font-size: 14px; }
.exec-table td { padding: 15px 12px; border-bottom: 1px solid #eee; font-size: 14px; }

.tag-sev { padding: 5px 15px; border-radius: 20px; color: white; font-weight: 700; font-size: 12px; display: inline-block; min-width: 80px; text-align: center; }
.tag-sev.red { background: #ff0000; }
.tag-sev.yellow { background: #fbff00; color: #000; }
.tag-sev.blue { background: #3498db; }
.tag-status { padding: 5px 15px; border: 1px solid #000; border-radius: 20px; font-size: 12px; font-weight: bold; }
.tag-status.analise { background: #dff9fb; color: #130f40; border-color: #3498db; }
.tag-status.notificado { background: #f9ca2433; border-color: #f9ca24; }
.tag-status.pendente { background: #eee; border-color: #ccc; }
.btn-small-action { background: white; border: 1px solid #000; border-radius: 15px; padding: 5px 15px; font-size: 12px; font-weight: bold; cursor: pointer; }

.bottom-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.prog-row { margin-bottom: 20px; }
.prog-labels { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px; font-size: 14px; }
.progress-bar-bg { background: #eee; height: 16px; border-radius: 8px; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.5s ease-in-out; }
.bg-green { background: #00ff00; }
.bg-red { background: #ff0000; }
.bg-orange { background: #f39c12; }

.action-summary-list { display: flex; flex-direction: column; gap: 15px; }
.summary-item { display: flex; justify-content: space-between; padding: 15px 20px; border: 1px solid #000; border-radius: 10px; font-weight: bold; font-size: 18px; }
.success-border { border-color: #00ff00; }

.export-buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

.export-buttons-grid .export-btn { background: white; border: 1.5px solid #000; border-radius: 10px; padding: 15px; text-align: left; font-weight: bold; font-size: 14px; cursor: pointer; transition: background 0.2s; }
.export-buttons-grid .export-btn:hover { background: #f5f5f5; }

/* Modal*/
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); z-index: 1000;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(2px);
}
.modal-content {
  background: white; padding: 30px; border-radius: 12px;
  width: 500px; max-width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); border: 1px solid #000;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;
}
.modal-header h3 { margin: 0; font-size: 20px; font-weight: 800; }
.close-btn { background: none; border: none; font-size: 28px; cursor: pointer; line-height: 1; }
.modal-intro { font-size: 14px; color: #666; margin-bottom: 20px; }
.detail-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
.detail-row { display: flex; flex-direction: column; }
.detail-row strong { font-size: 12px; text-transform: uppercase; color: #888; }
.detail-row span { font-size: 16px; font-weight: 600; }
.modal-actions { display: flex; gap: 15px; justify-content: flex-end; }

</style>
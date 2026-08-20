<template>
  <div class="global-header">
    <div class="brand-center">InsideAirbnb</div>
  </div>

  <aside :class="['sidebar', { open: isOpen }]">
    <nav>
      <ul>
        <li @click="go('/home')">🏠 Home</li>
        <li @click="go('/temporal')">📊 Análise Temporal</li>
        <li @click="go('/mapa')">🗺️ Mapeamento</li>
        <li @click="go('/anomalias')">⚠️ Anomalias</li>
        <li @click="go('/dashboard')">📈 Dashboard Executivo</li>
        <li @click="go('/exportar')">📤 Exportar Dados</li>
      </ul>
    </nav>
  </aside>

  <div
    v-if="isOpen"
    class="overlay-blocker"
    @click="emit('close')"
  ></div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])
const router = useRouter()

function go(route) {
  emit('close')
  router.push(route)
}
</script>

<style scoped>
/* ESTILOS DA BARRA GLOBAL */
.global-header {
  width: 100%;
  height: 60px;
  background-color: #E3E3E3;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.brand-center {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 20px;
  color: #0A1733;
  letter-spacing: -0.5px;
}

/* ESTILOS DA SIDEBAR */
.sidebar {
  position: fixed;
  top: 60px; 
  left: -260px;
  width: 260px;
  height: calc(100vh - 60px);
  background: #E3E3E3;
  padding: 20px;
  border-right: 1px solid #ccc;
  transition: left 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}

.sidebar.open {
  left: 0;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 15px 10px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #d1d1d1;
  border-radius: 4px;
  margin-bottom: 5px;
  transition: background 0.2s;
}

.sidebar li:hover {
  background: #d4d4d4;
}

/* OVERLAY */
.overlay-blocker {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 900;
  backdrop-filter: blur(2px);
}
</style>
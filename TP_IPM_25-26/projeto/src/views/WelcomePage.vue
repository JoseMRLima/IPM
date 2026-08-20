<template>
  <div class="welcome-container">
    <div class="glass-card">
      <h1 class="title">InsideAirbnb</h1>
      <h2 class="subtitle">Monitorização e Impacto do Airbnb nas Cidades</h2>
      
      <button class="btn-action" @click="goLogin">
        Aceder à Plataforma
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.welcome-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/worldmap.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 60px 50px;
  border-radius: 16px;
  text-align: center;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.title {
  font-size: 56px;
  font-weight: 800;
  color: #0A1733;
  margin: 0 0 15px 0;
  letter-spacing: -1.5px;
}

.subtitle {
  font-size: 20px;
  color: #555;
  font-weight: 500;
  margin: 0 0 40px 0;
  line-height: 1.4;
}

.btn-action {
  background: #0A1733;
  color: white;
  border: none;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(10, 23, 51, 0.2);
}

.btn-action:hover {
  background: #152c5b;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(10, 23, 51, 0.3);
}
</style>
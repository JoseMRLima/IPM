<template>
  <div class="register-wrapper">
    <div class="register-card">
      <h2 class="title">Criar Conta</h2>
      <p class="subtitle">Junta-te à plataforma InsideAirbnb</p>

      <form @submit.prevent="register">
        <div class="input-group">
          <label>Username</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Escolhe um nome de utilizador" 
            required 
          />
        </div>

        <div class="input-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Mínimo 4 caracteres" 
            required 
          />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-primary">Registar</button>

        <div class="divider"></div>

        <p class="switch-text">
          Já tens conta?
          <span @click="goLogin" class="link">Entrar</span>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref(null)

const router = useRouter()

function register() {
  if (password.value.length < 4) {
    error.value = "A password deve ter pelo menos 4 caracteres"
    return
  }

  const user = {
    username: username.value,
    password: btoa(password.value) 
  }

  localStorage.setItem("user", JSON.stringify(user))
  router.push('/login')
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #0A1733;
  margin-bottom: 5px;
  margin-top: 0;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.input-group {
  text-align: left;
  margin-bottom: 15px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  border-color: #0A1733;
  outline: none;
}

.error-msg {
  color: #e74c3c;
  background: #fdecea;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 15px;
  text-align: left;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #0A1733;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #152c5b;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 25px 0;
}

.switch-text {
  font-size: 14px;
  color: #666;
}

.link {
  color: #0A1733;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.link:hover {
  color: #3498db;
}
</style>
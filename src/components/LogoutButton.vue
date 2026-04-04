<template>
    <button class="logout-btn" @click="logout">Log out</button>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'vue-router'

const router = useRouter()

async function logout() {
  await signOut(auth)
  router.push('/')
}
</script>

<style scoped>
.logout-btn {
  padding: 8px 16px;
  background: white;
  color: #f77519;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
.logout-btn:hover {
  background: #f77519;
  color: white;
}
</style>
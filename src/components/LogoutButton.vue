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
  color: var(--col-main);
  border: 3px transparent solid;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
.logout-btn:hover {
  background: var(--col-hover);
  color: white;
}
</style>
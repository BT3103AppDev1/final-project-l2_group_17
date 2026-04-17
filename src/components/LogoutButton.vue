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
  padding: 8px 8px;
  background: transparent;
  color: var(--col-main);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: var(--font-nav);
  display: inline-block;
  border: 2px solid transparent;
}

.logout-btn:hover {
  background: var(--col-main);
  color: white;
}
</style>
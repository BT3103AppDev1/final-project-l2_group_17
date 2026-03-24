<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Login from '@/views/Login.vue'
</script>

<template>
  <Login />
  <div id="app">
    <nav>
      <router-link to="@/views/Checkout.vue">🛒 Go to Checkout (Dev Link)</router-link>
    </nav>

    <router-view />
  </div>
</template>

<style scoped></style>

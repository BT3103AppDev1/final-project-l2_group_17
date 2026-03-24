<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
</script>

<template>
  <div id="app">
    <nav style="padding: 20px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
      <router-link to="/checkout" style="font-weight: bold; color: #e67e22; text-decoration: none;">
        🛒 Go to Checkout (Dev Link)
      </router-link>
      
      <span style="margin: 0 10px;">|</span>
      
      <router-link to="/" style="text-decoration: none; color: #333;">
        Back to Login
      </router-link>
    </nav>

    <router-view />
  </div>
</template>

<style scoped></style>

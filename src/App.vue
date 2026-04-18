
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style scoped>
</style>

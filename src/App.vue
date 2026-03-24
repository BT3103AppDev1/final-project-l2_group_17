<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import LoginPage from '@/views/LoginPage.vue'
</script>

<template>
  <LoginPage />
</template>

<style scoped></style>

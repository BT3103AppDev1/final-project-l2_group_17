<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Login from '@/views/Login.vue'
</script>

<template>
  <Login />
</template>

<style scoped></style>

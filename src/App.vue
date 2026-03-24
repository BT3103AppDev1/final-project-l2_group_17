<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import "./assets/global.css"
import Login from '@/views/LoginPage.vue'

</script>

<template>
  <Login />
</template>

<style scoped></style>

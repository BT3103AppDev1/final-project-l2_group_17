<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import "./assets/global.css"
import Login from '@/views/LoginPage.vue'
import CustomerMenu from './views/CustomerMenu.vue'

</script>

<template>
  <Login />
</template>

<style scoped></style>

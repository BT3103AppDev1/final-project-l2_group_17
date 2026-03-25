<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import LoginPage from '@/views/LoginPage.vue'
import AdminMenu from './views/AdminMenu.vue';
</script>

<template>
  <AdminMenu />
</template>

<style scoped></style>

<script setup>
import "./assets/global.css"
import Login from '@/views/LoginPage.vue'
import CustomerMenu from './views/CustomerMenu.vue'
import { RouterView } from 'vue-router'

</script>

<template>
  <RouterView />
  <Login />
  <CustomerMenu />
</template>

<style scoped></style>

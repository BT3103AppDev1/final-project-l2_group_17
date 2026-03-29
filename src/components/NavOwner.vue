<template>
  <nav class="navbar">
    <span class="nav-brand">🍽️ Home Kitchen</span>

    <div class="nav-actions">
      <RouterLink to="/owner/dashboard" class="navtab">Dashboard</RouterLink>
      <RouterLink to="/customer/menu" class="navtab">Menu</RouterLink>
      <RouterLink to="/owner/profile" class="navtab">My Profile</RouterLink>
      <LogoutButton />
    </div>
  </nav>
</template>

<script setup>
import LogoutButton from './LogoutButton.vue'
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;  /* pushes brand left, actions right */
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #eee;
}

.nav-brand {
  font-size: 2.2rem;
  font-weight: 700;
  color: #f77519;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navtab {
  padding: 8px 16px;
  background: transparent;
  color: #f77519;
  border: 2px solid #f77519;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.router-link-active {
  background: #f77519;
  color: white;
}
</style>
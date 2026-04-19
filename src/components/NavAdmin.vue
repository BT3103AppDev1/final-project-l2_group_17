<template>
  <nav class="navbar">
    <span class="nav-brand">🍽️ Home Kitchen</span>

    <div class="nav-actions">
      <RouterLink to="/admin/dashboard" class="navtab">Dashboard</RouterLink>
      <RouterLink to="/admin/menu" class="navtab">Menu</RouterLink>
      <RouterLink to="/admin/orders" class="navtab">Orders</RouterLink>
      <RouterLink to="/admin/calendar" class="navtab">Calendar</RouterLink>
      <RouterLink to="/admin/report" class="navtab">Reports</RouterLink>
      <RouterLink to="/admin/profile" class="navtab">My Profile</RouterLink>
      <LogoutButton />
    </div>
  </nav>
  <EmailVerification />
</template>

<script setup>
import LogoutButton from './LogoutButton.vue'
import { RouterLink } from 'vue-router'
import EmailVerification from './EmailVerification.vue'
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 24px;
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.nav-brand {
  font-size: clamp(1.2rem, 2.4vw, 1.5rem);
  font-weight: 700;
  color: var(--col-main);
}

.nav-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.navtab {
  padding: 8px 16px;
  background: white;
  color: var(--col-main);
  border: 2px solid var(--col-main);
  border-radius: 8px;
  cursor: pointer;
  font-size: var(--font-nav);
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.navtab:hover {
  background: var(--col-main);
  color: white;
}

.router-link-active {
  background: var(--col-main);
  color: white;
}

@media (max-width: 860px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

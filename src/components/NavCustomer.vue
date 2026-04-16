<template>
  <nav class="navbar">
    <span class="nav-brand">🍽️ Home Kitchen</span>

    <div class="nav-actions">
      <RouterLink to="/customer/menu" class="navtab">Menu</RouterLink>
      <RouterLink to="/customer/my_orders" class="navtab">My Orders</RouterLink>
      <RouterLink to="/customer/reviews" class="navtab">My Reviews</RouterLink>
      <RouterLink to="/customer/loyalty" class="navtab">My Points</RouterLink>
      <RouterLink to="/customer/profile" class="navtab">My Profile</RouterLink>
      
      <RouterLink to="/checkout" class="cart-icon-link" title="View Cart">
        <span class="cart-emoji">🛒</span>
      </RouterLink>
      
      <LogoutButton />
    </div>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import LogoutButton from './LogoutButton.vue'
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

.cart-icon-link {
  font-size: 1.5rem;
  text-decoration: none;
  padding: 8px;
  margin-right: 10px;
  transition: transform 0.2s;
}

.cart-icon-link:hover {
  transform: scale(1.1);
}

.cart-emoji {
  cursor: pointer;
}
</style>

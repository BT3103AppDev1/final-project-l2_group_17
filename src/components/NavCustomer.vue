<template>
  <nav class="navbar">
    <span class="nav-brand">🍽️ Home Kitchen</span>

    <div class="nav-actions">
      <RouterLink to="/customer/menu" class="navtab">Menu</RouterLink>
      <RouterLink to="/customer/reviews" class="navtab">Reviews</RouterLink>
      <RouterLink to="/customer/my_orders" class="navtab">My Orders</RouterLink>
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
  padding: 12px 2%;
  background: white;
  border-bottom: 1px solid #eee;
}

.nav-brand {
  font-size: var(--font-brand);
  font-weight: 700;
  color: var(--col-main);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navtab {
  padding: 8px 8px;
  background: transparent;
  color: var(--col-main);
  border: 2px solid var(--col-main);
  border-radius: 8px;
  cursor: pointer;
  font-size: var(--font-nav);
  text-decoration: none;
  display: inline-block;
}

.navtab.router-link-active {
  background: var(--col-main);
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

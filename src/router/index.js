import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/LoginPage.vue'
import CustomerMenu from '@/views/CustomerMenu.vue'
import CustomerOrders from '@/views/CustomerOrders.vue'
import AdminProfile from '@/views/AdminProfile.vue'
import AdminOrders from '@/views/AdminOrders.vue'
import AdminMenu from '@/views/AdminMenu.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/customer/menu',
    name: 'Customer Menu',
    component: CustomerMenu
  },
  {
    path: '/customer/my_orders',
    name: 'Customer Orders',
    component: CustomerOrders
  },
  {
    path: '/admin/profile',
    name: 'Admin Profile',
    component: AdminProfile
  },
  {
    path: '/admin/orders',
    name: 'Admin Orders',
    component: AdminOrders
  },
  {
    path: '/admin/menu',
    name: 'Admin Menu',
    component: AdminMenu
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

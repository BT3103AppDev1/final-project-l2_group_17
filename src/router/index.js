import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/LoginPage.vue'
import CustomerMenu from '@/views/CustomerMenu.vue'
import CustomerProfile from '@/views/CustomerProfile.vue'
import AdminProfile from '@/views/AdminProfile.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
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
    path: '/customer/profile',
    name: 'Customer Profile',
    component: CustomerProfile
  },
  {
    path: '/admin/profile',
    name: 'Admin Profile',
    component: AdminProfile
  },
  {
    path: '/admin/dashboard',
    name: 'Admin Dashboard',
    component: AdminDashboard
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
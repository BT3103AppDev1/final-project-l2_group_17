import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/LoginPage.vue'
import CustomerMenu from '@/views/CustomerMenu.vue'
import CustomerProfile from '@/views/CustomerProfile.vue'
import OwnerProfile from '@/views/OwnerProfile.vue'
import OwnerDashboard from '@/views/OwnerDashboard.vue'
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
    path: '/owner/profile',
    name: 'Owner Profile',
    component: OwnerProfile
  },
  {
    path: '/owner/dashboard',
    name: 'Owner Dashboard',
    component: OwnerDashboard
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
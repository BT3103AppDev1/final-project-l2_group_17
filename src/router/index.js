import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/LoginPage.vue'
import CustomerMenu from '@/views/CustomerMenu.vue'
import CustomerProfile from '@/views/CustomerProfile.vue'
import OwnerDashboard from '@/views/OwnerDashboard.vue'

const routes = [
    {
        path: '/',
        name: 'Login Page',
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
        path: '/owner/dashboard',
        name: 'Owner Dashboard',
        component: OwnerDashboard
    }
]
const router = createRouter({
    history: createWebHistory(),
    routes
})
export default router
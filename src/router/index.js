import { createRouter, createWebHistory } from 'vue-router'
import { db, auth } from '../firebase'
import { getDoc, doc } from 'firebase/firestore'

import LoginPage from '@/views/LoginPage.vue'
import CustomerMenu from '@/views/CustomerMenu.vue'
import CustomerOrders from '@/views/CustomerOrders.vue'
import CustomerProfile from '@/views/CustomerProfile.vue'
import AdminProfile from '@/views/AdminProfile.vue'
import AdminOrders from '@/views/AdminOrders.vue'
import AdminMenu from '@/views/AdminMenu.vue'
import AdminCalendar from '@/views/AdminCalendar.vue'
import AdminReport from '@/views/AdminReport.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/customer/menu',
    name: 'Customer Menu',
    component: CustomerMenu,
    meta: { requiresAuth: true, role: 'customer' }
  },
  {
    path: '/customer/my_orders',
    name: 'Customer Orders',
    component: CustomerOrders,
    meta: { requiresAuth: true, role: 'customer' }
  },
  {
    path: '/customer/profile',
    name: 'Customer Profile',
    component: CustomerProfile,
    meta: { requiresAuth: true, role: 'customer' }
  },
  {
    path: '/admin/orders',
    name: 'Admin Orders',
    component: AdminOrders,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/menu',
    name: 'Admin Menu',
    component: AdminMenu,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
  },
  {
    path: '/admin/calendar',
    name: 'Admin Calendar',
    component: AdminCalendar,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/report',
    name: 'Admin Report',
    component: AdminReport,
    meta: { requiresAuth: true, role: 'admin' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

let cachedUser = undefined
let cachedRole = undefined

auth.onAuthStateChanged(async (user) => {
  cachedUser = user

  if (user) {
    const docSnap = await getDoc(doc(db, "users", user.uid))
    if (docSnap.exists()) {
      cachedRole = docSnap.data().role
    } else {
      cachedRole = undefined
    }
  }
})

// Wait for Firebase to finish restoring the login session
function waitForAuth() {
  if (cachedUser !== undefined) return Promise.resolve(cachedUser)
  
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe()
      cachedUser = user
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid))
        if (docSnap.exists()) {
          cachedRole = docSnap.data().role
        }
      }
      resolve(user)
    })
  })
}

router.beforeEach(async (to) => {
  const user = await waitForAuth()

  if (to.matched.length === 0 || to.name === 'NotFound') {
    if (!user || !cachedRole) return '/'
    return cachedRole === 'admin' ? '/admin/orders' : '/customer/menu'
  }

  if (!to.meta.requiresAuth) return true

  if(!user || !cachedRole) return '/' // force back to login if not logged in

  if (to.meta.role !== cachedRole) {
    return cachedRole === 'admin' ? '/admin/orders' : '/customer/menu'// wrong role
  }

  return true
})

export default router
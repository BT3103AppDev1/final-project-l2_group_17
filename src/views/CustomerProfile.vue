<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'
import OrderCard from '@/components/OrderCard.vue'
import { subscribeToOrdersByUserId } from '@/services/orderService'
import CustomerProfile from '@/components/CustomerProfile.vue'
import NavCustomer from '@/components/NavCustomer.vue'

const orders = ref([])
const currentUser = ref(null)
const loading = ref(false)
const errorMessage = ref('')

let unsubscribeOrders = null
let unsubscribeAuth = null

const orderCount = computed(() => orders.value.length)

function resetOrdersSubscription() {
  unsubscribeOrders?.()
  unsubscribeOrders = null
}

function subscribeForUser(user) {
  resetOrdersSubscription()

  if (!user?.uid) {
    orders.value = []
    loading.value = false
    errorMessage.value = 'Please sign in to view your orders.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  unsubscribeOrders = subscribeToOrdersByUserId(
    user.uid,
    (nextOrders) => {
      orders.value = nextOrders
      loading.value = false
    },
    (error) => {
      errorMessage.value = error.message
      loading.value = false
    },
  )
}

function formatStatusLabel(status) {
  return String(status || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    subscribeForUser(user)
  })
})

onUnmounted(() => {
  unsubscribeAuth?.()
  resetOrdersSubscription()
})
</script>

<template>
  <NavCustomer />
  <section class="page-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">My Orders</p>
        <h1>Track order status</h1>
        <p class="body-copy">
          View all placed orders and follow each order as it moves from pending to pickup or
          completion.
        </p>
      </div>
      <div class="summary-card">
        <span class="summary-label">Orders</span>
        <strong class="summary-value">{{ orderCount }}</strong>
      </div>
    </header>

    <p v-if="currentUser?.email || currentUser?.uid" class="signed-in-copy">
      Signed in as {{ currentUser.email || currentUser.uid }}
    </p>

    <div v-if="loading" class="message-card">Loading your orders...</div>
    <div v-else-if="errorMessage" class="message-card error">{{ errorMessage }}</div>
    <div v-else-if="!orders.length" class="message-card">
      You do not have any orders yet.
    </div>

    <div v-else class="orders-grid">
      <article v-for="order in orders" :key="order.id" class="order-panel">
        <OrderCard :order="order" />

        <section v-if="order.statusHistory?.length" class="history-panel">
          <div class="history-header">
            <h2>Status history</h2>
            <span class="history-count">{{ order.statusHistory.length }} updates</span>
          </div>

          <ol class="history-list">
            <li v-for="(entry, index) in order.statusHistory" :key="`${order.id}-${index}`">
              <div class="history-dot" />
              <div class="history-body">
                <p class="history-status">{{ formatStatusLabel(entry.status) }}</p>
                <p class="history-meta">
                  Updated by {{ entry.updatedBy || 'system' }} on {{ entry.updatedAt }}
                </p>
              </div>
            </li>
          </ol>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 28px;
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 45px rgba(96, 63, 30, 0.08);
}

.eyebrow,
.body-copy,
.signed-in-copy,
.summary-label,
.summary-value,
.message-card,
.history-count,
.history-status,
.history-meta,
h1,
h2 {
  margin: 0;
}

.eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #b05a2b;
}

h1 {
  margin-top: 8px;
  color: #3f220f;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.body-copy,
.signed-in-copy,
.history-count,
.history-meta {
  color: #6f5545;
}

.body-copy {
  margin-top: 12px;
  max-width: 700px;
  line-height: 1.6;
}

.signed-in-copy {
  padding: 0 6px;
  font-weight: 700;
}

.summary-card,
.message-card,
.order-panel {
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.summary-card {
  min-width: 130px;
  padding: 18px;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8d684e;
}

.summary-value {
  display: block;
  margin-top: 8px;
  font-size: 2rem;
  color: #472715;
}

.message-card {
  padding: 18px 20px;
  color: #6f5545;
}

.message-card.error {
  background: #fff1f1;
  color: #8c1d1d;
}

.orders-grid {
  display: grid;
  gap: 18px;
}

.order-panel {
  padding: 18px;
}

.history-panel {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: #fff7f0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

h2 {
  font-size: 1rem;
  color: #472715;
}

.history-list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 14px;
}

.history-list li {
  display: grid;
  grid-template-columns: 12px 1fr;
  gap: 12px;
  align-items: start;
}

.history-dot {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 999px;
  background: #b85c38;
}

.history-status {
  font-weight: 800;
  color: #3f220f;
}

.history-meta {
  margin-top: 4px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }
}
</style>

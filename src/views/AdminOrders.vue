<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import OrderCard from '@/components/OrderCard.vue'
import {
  ORDER_STATUSES,
  getAllowedOrderTransitions,
  subscribeToAllOrders,
  updateOrderStatus,
} from '@/services/orderservice'
import NavAdmin from '@/components/NavAdmin.vue'

const STATUS_TABS = ORDER_STATUSES
const activeStatus = ref('pending')
const orders = ref([])
const loading = ref(false)
const errorMessage = ref('')
const busyOrderIds = ref([])

let unsubscribeOrders = null

const groupedOrders = computed(() =>
  STATUS_TABS.reduce((groups, status) => {
    groups[status] = orders.value.filter((order) => order.status === status)
    return groups
  }, {}),
)

const activeOrderCount = computed(
  () => orders.value.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
)

const filteredOrders = computed(() => groupedOrders.value[activeStatus.value] || [])

function formatStatusLabel(status) {
  return String(status || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isBusy(orderId) {
  return busyOrderIds.value.includes(orderId)
}

function setBusy(orderId, value) {
  busyOrderIds.value = value
    ? [...busyOrderIds.value, orderId]
    : busyOrderIds.value.filter((id) => id !== orderId)
}

function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  unsubscribeOrders = subscribeToAllOrders(
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

async function handleStatusUpdate(orderId, nextStatus) {
  setBusy(orderId, true)
  errorMessage.value = ''

  try {
    await updateOrderStatus(orderId, nextStatus, 'admin')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    setBusy(orderId, false)
  }
}

function nextAction(order) {
  const transitions = getAllowedOrderTransitions(order.status)
  return transitions.find((status) => status !== 'cancelled') || null
}

function canCancel(order) {
  return getAllowedOrderTransitions(order.status).includes('cancelled')
}

onMounted(() => {
  loadOrders()
})

onUnmounted(() => {
  unsubscribeOrders?.()
})
</script>

<template>
  <NavAdmin />
  <section class="page-shell">
    <header class="page-header">
      <div>
        <h1>Manage orders</h1>
        <p class="body-copy">
          Review all placed orders by status. Select a category to view matching orders, then move each order one step forward or cancel it.
        </p>
      </div>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Total orders</span>
          <strong class="summary-value">{{ orders.length }}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-label">Active orders</span>
          <strong class="summary-value">{{ activeOrderCount }}</strong>
        </div>
      </div>
    </header>

    <div class="tabs-panel">
      <button
        v-for="status in STATUS_TABS"
        :key="status"
        type="button"
        class="tab-button"
        :class="{ active: activeStatus === status }"
        @click="activeStatus = status"
      >
        {{ formatStatusLabel(status) }}
        <span class="tab-count">{{ groupedOrders[status]?.length || 0 }}</span>
      </button>
    </div>

    <div v-if="loading" class="message-card">Loading orders...</div>
    <div v-else-if="errorMessage" class="message-card error">{{ errorMessage }}</div>
    <div v-else-if="!filteredOrders.length" class="message-card">
      No {{ formatStatusLabel(activeStatus).toLowerCase() }} orders found.
    </div>

    <div v-else class="orders-grid">
      <article v-for="order in filteredOrders" :key="order.id" class="order-panel">
        <OrderCard :order="order" />

        <div class="action-panel">
          <p class="action-title">Order actions</p>

          <div class="actions">
            <button
              v-if="nextAction(order)"
              type="button"
              class="action-button"
              :disabled="isBusy(order.id)"
              @click="handleStatusUpdate(order.id, nextAction(order))"
            >
              Mark as {{ formatStatusLabel(nextAction(order)) }}
            </button>

            <button
              v-if="canCancel(order)"
              type="button"
              class="action-button danger"
              :disabled="isBusy(order.id)"
              @click="handleStatusUpdate(order.id, 'cancelled')"
            >
              Mark as Cancelled
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 20px;
}

.page-header,
.tabs-panel,
.summary-card,
.message-card,
.order-panel {
  border: 1px solid rgba(91, 57, 36, 0.12);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 28px;
  border-radius: 28px;
}

.eyebrow,
.body-copy,
.summary-label,
.summary-value,
.message-card,
.action-title,
h1 {
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
.message-card {
  color: #6f5545;
}

.body-copy {
  margin-top: 12px;
  line-height: 1.6;
}

.summary-card {
  min-width: 140px;
  padding: 18px;
  border-radius: 24px;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
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

.tabs-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 18px;
  border-radius: 24px;
}

.tab-button {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  background: #ecd5c4;
  color: #5d3522;
  font-weight: 700;
  cursor: pointer;
}

.tab-button.active {
  background: var(--col-main);
  color: #fff8ef;
}

.tab-count {
  margin-left: 8px;
  opacity: 0.9;
}

.message-card {
  padding: 18px 20px;
  border-radius: 24px;
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
  border-radius: 24px;
}

.action-panel {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: #fff7f0;
}

.action-title {
  font-weight: 800;
  color: #472715;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.action-button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: #b85c38;
  color: #fff8ef;
  font-weight: 700;
  cursor: pointer;
}

.action-button.danger {
  background: #c94f4f;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }

  .summary-grid {
    width: 100%;
  }
}
</style>

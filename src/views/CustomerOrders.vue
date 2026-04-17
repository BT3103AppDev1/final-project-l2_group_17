<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import OrderCard from '@/components/OrderCard.vue'
import {
  getAllowedOrderTransitions,
  subscribeToOrdersByUserId,
  updateOrderStatus,
} from '@/services/orderservice'
import NavCustomer from '@/components/NavCustomer.vue'

// 1. IMPORT THE REVIEW FORM
import ReviewForm from '@/components/ReviewForm.vue'

const orders = ref([])
const currentUser = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const busyOrderIds = ref([])

// 2. STATE FOR THE REVIEW MODAL
const showReviewModal = ref(false)
const orderBeingReviewed = ref(null)

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

function isBusy(orderId) {
  return busyOrderIds.value.includes(orderId)
}

function setBusy(orderId, value) {
  busyOrderIds.value = value
    ? [...busyOrderIds.value, orderId]
    : busyOrderIds.value.filter((id) => id !== orderId)
}

function canCancelOrder(order) {
  return getAllowedOrderTransitions(order.status).includes('cancelled')
}

function cancellationTooltip(order) {
  return canCancelOrder(order)
    ? 'Cancel this order'
    : 'Cancellation is no longer allowed at this stage.'
}

async function handleCancelOrder(order) {
  if (!canCancelOrder(order) || isBusy(order.id)) {
    return
  }

  console.log(`Cancelling order ${order.orderId || order.id} cannot be undone.`)

  const confirmed = window.confirm(
    'Cancelling this order cannot be undone. Click OK to proceed.',
  )

  if (!confirmed) {
    return
  }

  setBusy(order.id, true)
  errorMessage.value = ''

  try {
    await updateOrderStatus(order.id, 'cancelled', currentUser.value?.uid || 'customer')
  } catch (error) {
    console.error('Error cancelling order:', error)
    errorMessage.value = error.message || 'Failed to cancel order.'
  } finally {
    setBusy(order.id, false)
  }
}

// 3. FUNCTIONS TO HANDLE REVIEWS
const openReviewModal = (order) => {
  orderBeingReviewed.value = order
  showReviewModal.value = true
}

const handleReviewSubmit = async (reviewData) => {
  const user = auth.currentUser;
  
  if (!user) {
    alert("You must be logged in to leave a review.");
    return;
  }

  try {
    console.log("Saving review to Firestore...");

    // 1. Save the review document
    await addDoc(collection(db, 'reviews'), {
      userId: user.uid,
      userEmail: user.email,
      orderId: orderBeingReviewed.value.id,
      rating: reviewData.rating,
      text: reviewData.text,
      imageUrl: reviewData.imageUrl, // This is either the Base64 string or null
      createdAt: serverTimestamp()
    });

    // 2. Mark the order as reviewed so they can't review it twice
    const orderRef = doc(db, 'orders', orderBeingReviewed.value.id);
    await updateDoc(orderRef, { hasReviewed: true });

    alert('Thank you! Your review has been posted.');

  } catch (error) {
    console.error("Error posting review:", error);
    alert('Failed to post review. Please try again.');
  } finally {
    // Close the modal
    showReviewModal.value = false;
    orderBeingReviewed.value = null;
  }
}
function formatHistoryTimestamp(value) {
  if (!value) return 'an unknown time'

  const date =
    typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Singapore',
  }).format(date)
}

function formatUpdatedBy(updatedBy) {
  if (!updatedBy) return 'system'

  if (updatedBy === 'admin') return 'admin'
  if (updatedBy === 'system') return 'system'

  if (currentUser.value?.uid && updatedBy === currentUser.value.uid) {
    return 'you'
  }

  return 'customer'
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

        <div class="order-actions">
          <div v-if="!order.hasReviewed" class="review-action-container">
            <button @click="openReviewModal(order)" class="review-btn">
              ⭐ Leave a Review
            </button>
          </div>

          <span class="cancel-action-container" :title="cancellationTooltip(order)">
            <button
              type="button"
              class="cancel-btn"
              :disabled="!canCancelOrder(order) || isBusy(order.id)"
              @click="handleCancelOrder(order)"
            >
              {{ isBusy(order.id) ? 'Cancelling...' : 'Cancel Order' }}
            </button>
          </span>
        </div>

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
                  Updated by {{ formatUpdatedBy(entry.updatedBy) }} on {{ formatHistoryTimestamp(entry.updatedAt) }}
                </p>
              </div>
            </li>
          </ol>
        </section>
      </article>
    </div>
  </section>

  <ReviewForm 
    v-if="showReviewModal" 
    @close="showReviewModal = false" 
    @submit="handleReviewSubmit" 
  />

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

.order-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.review-action-container,
.cancel-action-container {
  display: inline-flex;
}

.review-btn {
  background: white;
  color: #f77519;
  border: 2px solid #f77519;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.review-btn:hover {
  background: #f77519;
  color: white;
}

.cancel-btn {
  background: #fff7f0;
  color: #b85c38;
  border: 2px solid #b85c38;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #b85c38;
  color: white;
}

.cancel-btn:disabled {
  background: #e5e7eb;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
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

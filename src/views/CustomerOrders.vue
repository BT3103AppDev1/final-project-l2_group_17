<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import OrderCard from '@/components/OrderCard.vue'
import {
  getAllowedOrderTransitions,
  subscribeToOrdersByUserId,
  updateOrderStatus,
} from '@/services/orderservice'
import {
  buildReviewItemKey,
  subscribeToReviewsByUserId,
} from '@/services/reviewService'
import {
  VERIFICATION_MESSAGES,
  watchEmailVerification,
} from '@/services/verificationService'
import NavCustomer from '@/components/NavCustomer.vue'
import ReviewForm from '@/components/ReviewForm.vue'

const orders = ref([])
const userReviews = ref([])
const currentUser = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const busyOrderIds = ref([])
const showReviewModal = ref(false)
const reviewTarget = ref(null)
const submittingReview = ref(false)
const isEmailVerified = ref(false)

let unsubscribeOrders = null
let unsubscribeAuth = null
let unsubscribeReviews = null
let unsubscribeVerification = null

const orderCount = computed(() => orders.value.length)
const reviewedItemKeys = computed(
  () =>
    new Set(
      userReviews.value
        .filter((review) => review.menuItemId && (review.orderDocId || review.orderId))
        .map((review) =>
          buildReviewItemKey(review.orderDocId || review.orderId, review.menuItemId),
        ),
    ),
)

function resetOrdersSubscription() {
  unsubscribeOrders?.()
  unsubscribeOrders = null
}

function resetReviewsSubscription() {
  unsubscribeReviews?.()
  unsubscribeReviews = null
}

function subscribeForUser(user) {
  resetOrdersSubscription()
  resetReviewsSubscription()

  if (!user?.uid) {
    orders.value = []
    userReviews.value = []
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

  unsubscribeReviews = subscribeToReviewsByUserId(
    user.uid,
    (nextReviews) => {
      userReviews.value = nextReviews
    },
    (error) => {
      console.error('Error loading customer reviews:', error)
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

function canReviewOrder(order) {
  return order.status === 'completed'
}

function hasSubmittedReview(order, item) {
  return reviewedItemKeys.value.has(buildReviewItemKey(order.id, item?.menuItemId))
}

function canReviewItem(order, item) {
  return (
    canReviewOrder(order) &&
    isEmailVerified.value &&
    item?.menuItemId &&
    !hasSubmittedReview(order, item)
  )
}

function reviewTooltip(order, item) {
  if (!isEmailVerified.value) {
    return VERIFICATION_MESSAGES.customerReview
  }

  if (!canReviewOrder(order)) {
    return 'Reviews are available after an order is completed.'
  }

  if (!item?.menuItemId) {
    return 'This item cannot be reviewed right now.'
  }

  if (hasSubmittedReview(order, item)) {
    return 'Review already submitted for this item.'
  }

  return 'Leave a review for this item.'
}

function openReviewModal(order, item) {
  if (!canReviewItem(order, item)) {
    return
  }

  reviewTarget.value = { order, item }
  showReviewModal.value = true
}

function closeReviewModal() {
  showReviewModal.value = false
  reviewTarget.value = null
}

async function handleReviewSubmit(reviewData) {
  const user = auth.currentUser

  if (!user || !reviewTarget.value) {
    alert('You must be logged in to leave a review.')
    return
  }

  if (!user.emailVerified) {
    return
  }

  const { order, item } = reviewTarget.value

  try {
    submittingReview.value = true

    await addDoc(collection(db, 'reviews'), {
      userId: user.uid,
      userEmail: user.email,
      orderDocId: order.id,
      orderId: order.orderId || order.id,
      menuItemId: item.menuItemId,
      menuItemName: item.name,
      rating: reviewData.rating,
      text: reviewData.text,
      imageUrl: reviewData.imageUrl,
      createdAt: serverTimestamp(),
    })

    alert(`Thank you. Your review for ${item.name} has been posted.`)
    closeReviewModal()
  } catch (error) {
    console.error('Error posting review:', error)
    alert('Failed to post review. Please try again.')
  } finally {
    submittingReview.value = false
  }
}

function formatHistoryTimestamp(value) {
  if (!value) return 'an unknown time'

  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)

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

function reviewButtonLabel(order, item) {
  return hasSubmittedReview(order, item) ? 'Review Submitted' : 'Leave a Review'
}

onMounted(() => {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    subscribeForUser(user)
  })

  unsubscribeVerification = watchEmailVerification((verified) => {
    isEmailVerified.value = verified
  })
})

onUnmounted(() => {
  unsubscribeAuth?.()
  unsubscribeVerification?.()
  resetOrdersSubscription()
  resetReviewsSubscription()
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
          View all placed orders, cancel eligible ones, and leave item-specific reviews after an
          order is completed.
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

        <section v-if="canReviewOrder(order)" class="review-panel">
          <div class="review-header">
            <div>
              <h2>Review purchased items</h2>
              <p class="review-copy">
                Leave a separate review for each menu item so other customers can see your feedback.
              </p>
            </div>
          </div>

          <div class="review-items">
            <div
              v-for="item in order.items"
              :key="`${order.id}-${item.menuItemId}`"
              class="review-item-row"
            >
              <div>
                <p class="review-item-name">{{ item.name }}</p>
                <p class="review-item-meta">
                  {{ item.quantity }} item{{ item.quantity > 1 ? 's' : '' }} purchased
                </p>
              </div>

              <span :title="reviewTooltip(order, item)">
                <button
                  type="button"
                  class="review-btn"
                  :disabled="!canReviewItem(order, item)"
                  @click="openReviewModal(order, item)"
                >
                  {{ reviewButtonLabel(order, item) }}
                </button>
              </span>
            </div>
          </div>
        </section>

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
                  Updated by {{ formatUpdatedBy(entry.updatedBy) }} on
                  {{ formatHistoryTimestamp(entry.updatedAt) }}
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
    :item-name="reviewTarget?.item?.name"
    :is-submitting="submittingReview"
    @close="closeReviewModal"
    @submit="handleReviewSubmit"
  />
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 20px;
  padding: 2%
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
.review-copy,
.review-item-name,
.review-item-meta,
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
.history-meta,
.review-copy,
.review-item-meta {
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
}

.cancel-action-container {
  display: inline-flex;
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

.review-panel,
.history-panel {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: #fff7f0;
}

.review-header,
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

.review-copy {
  margin-top: 6px;
  line-height: 1.5;
}

.review-items {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.review-item-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
}

.review-item-name {
  font-weight: 800;
  color: #3f220f;
}

.review-item-meta {
  margin-top: 4px;
  font-size: 0.92rem;
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

.review-btn:hover:not(:disabled) {
  background: #f77519;
  color: white;
}

.review-btn:disabled {
  background: #e5e7eb;
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
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
  .page-header,
  .review-item-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-btn {
    width: 100%;
  }
}
</style>

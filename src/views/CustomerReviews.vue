<template>
  <NavCustomer />
  <div class="customer-reviews-container">
    <header class="page-header">
      <div>
        <h1>My Reviews</h1>
        <p class="subtitle">A history of the item-specific feedback and photos you've shared.</p>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Reviews</span>
        <span class="stat-number">{{ reviews.length }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">Loading your reviews...</div>
    <div v-else-if="reviews.length === 0" class="empty-state">
      You haven't written any reviews yet.
      <br />
      <router-link to="/customer/my_orders" class="browse-link">
        Go to My Orders to leave one.
      </router-link>
    </div>

    <div v-else class="reviews-grid">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div>
            <p class="item-name">{{ review.menuItemName || 'Menu item review' }}</p>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <div class="stars">{{ renderStars(review.rating) }}</div>
        </div>

        <p class="review-text">"{{ review.text }}"</p>

        <div v-if="review.imageUrl" class="review-image-container">
          <img :src="review.imageUrl" alt="Your review photo" class="review-image" />
        </div>

        <div class="review-footer">
          <span>Order ID: {{ review.orderId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { auth } from '@/firebase'
import NavCustomer from '@/components/NavCustomer.vue'
import { subscribeToReviewsByUserId } from '@/services/reviewService'

const reviews = ref([])
const loading = ref(true)

let unsubscribeAuth = null
let unsubscribeReviews = null

function resetReviewsSubscription() {
  unsubscribeReviews?.()
  unsubscribeReviews = null
}

function renderStars(rating) {
  const safeRating = Number(rating || 0)
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating)
}

function formatDate(timestamp) {
  if (!timestamp) return 'Just now'

  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Singapore',
  }).format(date)
}

onMounted(() => {
  unsubscribeAuth = auth.onAuthStateChanged((user) => {
    resetReviewsSubscription()

    if (!user) {
      loading.value = false
      reviews.value = []
      return
    }

    loading.value = true

    unsubscribeReviews = subscribeToReviewsByUserId(
      user.uid,
      (nextReviews) => {
        reviews.value = nextReviews
        loading.value = false
      },
      (error) => {
        console.error('Error fetching customer reviews:', error)
        loading.value = false
      },
    )
  })
})

onUnmounted(() => {
  unsubscribeAuth?.()
  resetReviewsSubscription()
})
</script>

<style scoped>
.customer-reviews-container {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
  font-family: sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1,
.subtitle,
.item-name,
.review-text {
  margin: 0;
}

.page-header h1 {
  font-size: 2.2rem;
  color: #333;
}

.subtitle {
  margin-top: 8px;
  color: #666;
}

.stat-box {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 15px 25px;
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #ea580c;
  text-transform: uppercase;
  font-weight: bold;
}

.stat-number {
  font-size: 1.8rem;
  color: #ea580c;
  font-weight: 800;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.review-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.item-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #333;
}

.date {
  font-size: 0.85rem;
  color: #888;
}

.stars {
  color: #f77519;
  font-size: 1.2rem;
  letter-spacing: 2px;
}

.review-text {
  color: #444;
  line-height: 1.6;
  margin-bottom: 20px;
  font-style: italic;
  flex-grow: 1;
}

.review-image-container {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.review-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.review-footer {
  border-top: 1px solid #eee;
  padding-top: 16px;
  font-size: 0.85rem;
  color: #999;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.2rem;
  background: white;
  border-radius: 16px;
  border: 1px dashed #ccc;
  margin-top: 20px;
}

.browse-link {
  display: inline-block;
  margin-top: 15px;
  color: #f77519;
  text-decoration: none;
  font-weight: bold;
}

.browse-link:hover {
  text-decoration: underline;
}
</style>

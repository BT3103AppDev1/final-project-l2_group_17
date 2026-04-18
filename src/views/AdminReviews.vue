<template>
  <NavAdmin />
  <div class="admin-reviews-container">
    <header class="page-header">
      <div>
        <h1>Customer Reviews</h1>
        <p class="subtitle">Monitor item-specific feedback and ratings across all completed orders.</p>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Reviews</span>
        <span class="stat-number">{{ reviews.length }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">Loading reviews...</div>
    <div v-else-if="reviews.length === 0" class="empty-state">No reviews yet.</div>

    <div v-else class="reviews-grid">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div class="user-info">
            <strong>{{ review.userEmail }}</strong>
            <span class="item-name">{{ review.menuItemName || 'Menu item review' }}</span>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <div class="stars">{{ renderStars(review.rating) }}</div>
        </div>

        <p class="review-text">"{{ review.text }}"</p>

        <div v-if="review.imageUrl" class="review-image-container">
          <img :src="review.imageUrl" alt="Customer uploaded photo" class="review-image" />
        </div>

        <div class="review-footer">
          <span>Order ID: {{ review.orderId }}</span>
          <span>Item ID: {{ review.menuItemId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import NavAdmin from '@/components/NavAdmin.vue'
import { subscribeToAllReviews } from '@/services/reviewService'

const reviews = ref([])
const loading = ref(true)

let unsubscribeReviews = null

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
  unsubscribeReviews = subscribeToAllReviews(
    (nextReviews) => {
      reviews.value = nextReviews
      loading.value = false
    },
    (error) => {
      console.error('Error fetching reviews:', error)
      loading.value = false
    },
  )
})

onUnmounted(() => {
  unsubscribeReviews?.()
})
</script>

<style scoped>
.admin-reviews-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
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
  font-size: 2rem;
  color: #333;
}

.subtitle {
  margin-top: 8px;
  color: #666;
}

.stat-box {
  background: #fff3e0;
  border: 1px solid #ffe0b2;
  padding: 15px 25px;
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #e65100;
  text-transform: uppercase;
  font-weight: bold;
}

.stat-number {
  font-size: 1.8rem;
  color: #e65100;
  font-weight: 800;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.review-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.user-info {
  display: grid;
  gap: 4px;
}

.user-info strong {
  color: #222;
  font-size: 1.05rem;
}

.item-name {
  color: #b85c38;
  font-weight: 700;
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
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
}
</style>

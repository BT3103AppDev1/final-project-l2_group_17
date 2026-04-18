<template>
  <NavAdmin />
  <div class="admin-reviews-container">
    <header class="page-header">
      <div>
        <h1>Customer Reviews</h1>
        <p class="subtitle">Monitor feedback and ratings across all orders.</p>
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
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <div class="stars">{{ renderStars(review.rating) }}</div>
        </div>

        <p class="review-text">"{{ review.text }}"</p>

        <div v-if="review.imageUrl" class="review-image-container">
          <img :src="review.imageUrl" alt="Customer uploaded photo" class="review-image" />
        </div>

        <div class="review-footer">
          <span class="order-id">Order ID: {{ review.orderId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import NavAdmin from '@/components/NavAdmin.vue';

const reviews = ref([]);
const loading = ref(true);

// 1. Fetch All Reviews
const fetchReviews = async () => {
  try {
    // We order by 'createdAt' descending so the newest reviews show up first
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    reviews.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchReviews();
});

// --- Helper Functions for UI ---
const renderStars = (rating) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  // Convert Firestore timestamp to standard Date
  return timestamp.toDate().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
};
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

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  margin: 0;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.user-info strong {
  display: block;
  color: #222;
  font-size: 1.05rem;
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
  flex-grow: 1; /* Pushes the footer to the bottom */
  overflow-wrap: break-word;
  word-break: break-word;
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

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.2rem;
  background: white;
  border-radius: 16px;
  border: 1px dashed #ccc;
}
</style>
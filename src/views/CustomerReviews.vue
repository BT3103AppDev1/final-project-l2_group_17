<template>
  <NavCustomer />
  <div class="customer-reviews-container">
    <header class="page-header">
      <div>
        <h1>My Reviews</h1>
        <p class="subtitle">A history of the feedback and photos you've shared.</p>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Reviews</span>
        <span class="stat-number">{{ reviews.length }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading-state">Loading your reviews...</div>
    <div v-else-if="reviews.length === 0" class="empty-state">
      You haven't written any reviews yet.
      <br>
      <router-link to="/customer/my_orders" class="browse-link">Go to My Orders to leave one!</router-link>
    </div>

    <div v-else class="reviews-grid">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div class="stars">{{ renderStars(review.rating) }}</div>
          <span class="date">{{ formatDate(review.createdAt) }}</span>
        </div>

        <p class="review-text">"{{ review.text }}"</p>

        <div v-if="review.imageUrl" class="review-image-container">
          <img :src="review.imageUrl" alt="Your review photo" class="review-image" />
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
import { auth, db } from '@/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import NavCustomer from '@/components/NavCustomer.vue';

const reviews = ref([]);
const loading = ref(true);

// 1. Fetch Only the Logged-In User's Reviews
const fetchMyReviews = async (user) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', user.uid), // THIS IS THE MAGIC LINE
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    reviews.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching my reviews:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Wait to ensure Firebase Auth has verified the user
  auth.onAuthStateChanged((user) => {
    if (user) {
      fetchMyReviews(user);
    } else {
      loading.value = false;
    }
  });
});

// --- Helper Functions for UI ---
const renderStars = (rating) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  return timestamp.toDate().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
};
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

.page-header h1 {
  font-size: 2.2rem;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  margin: 0;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
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

.loading-state, .empty-state {
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
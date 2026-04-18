<template>
  <NavCustomer />
  <div class="customer-reviews-container">
    <header class="page-header">
      <div>
        <h1>Reviews</h1>
        <p class="subtitle">See what others are saying, or check your past feedback</p>
      </div>
      <div class="stat-box">
        <span class="stat-label">Total Reviews</span>
        <span class="stat-number">{{ displayedReviews.length }}</span>
      </div>
    </header>

    <div class="tabs-wrapper">
      <div class="tabs-container">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          Community Reviews
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'mine' }"
          @click="activeTab = 'mine'"
        >
          My Reviews
        </button>
      </div>

      <div v-if="activeTab === 'all' && uniqueMenuItems.length > 0" class="filter-container">
        <label for="item-filter">Filter by item:</label>
        <select id="item-filter" v-model="selectedMenuItem" class="styled-select">
          <option value="All Items">All Items</option>
          <option v-for="item in uniqueMenuItems" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading reviews...</div>
    <div v-else-if="displayedReviews.length === 0" class="empty-state">
      <span v-if="activeTab === 'mine'">
        You haven't written any reviews yet.
      <br>
      <router-link to="/customer/my_orders" class="browse-link">Go to My Orders to leave one!</router-link>
      </span>
      <span v-else-if="selectedMenuItem !== 'All Items'">
        No reviews found for {{ selectedMenuItem }}.
      </span>
      <span v-else>No reviews have been posted yet. Be the first!</span>
    </div>

    <div v-else class="reviews-grid">
      <div v-for="review in displayedReviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div>
            <p class="item-name">{{ review.menuItemName || 'Menu item review' }}</p>
            <span class="date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <div class="stars">{{ renderStars(review.rating) }}</div>
        </div>

        <p class="review-text">"{{ review.text }}"</p>

        <div v-if="review.imageUrl" class="review-image-container">
          <img :src="review.imageUrl" alt="Customer review photo" class="review-image" />
        </div>

        <div class="review-footer">
          <span v-if="activeTab === 'all'" class="reviewer-name">
            By: {{ formatName(review.userEmail) }}
          </span>
          <span v-else class="order-id">Order ID: {{ review.orderId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ADDED watch to the imports
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { auth, db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import NavCustomer from '@/components/NavCustomer.vue';
import { subscribeToReviewsByUserId } from '@/services/reviewService';

const activeTab = ref('all');
const myReviews = ref([]);
const communityReviews = ref([]);
const loading = ref(true);

// NEW: State for the dropdown filter
const selectedMenuItem = ref('All Items');

let unsubscribeAuth = null;
let unsubscribeReviews = null;

// --- Computed ---

// NEW: Extract all unique menu item names from the community reviews for the dropdown
const uniqueMenuItems = computed(() => {
  const itemNames = communityReviews.value
    .map(review => review.menuItemName)
    .filter(name => name); // Remove any null/undefined names
  
  // Use a Set to get unique values, then sort them alphabetically
  return [...new Set(itemNames)].sort();
});

// UPDATED: Filter logic added for the community tab
const displayedReviews = computed(() => {
  if (activeTab.value === 'mine') {
    return myReviews.value;
  } else {
    // If we are on the Community tab, apply the filter
    if (selectedMenuItem.value === 'All Items') {
      return communityReviews.value;
    }
    return communityReviews.value.filter(review => review.menuItemName === selectedMenuItem.value);
  }
});

// NEW: Reset the filter back to "All Items" if the user switches tabs
watch(activeTab, (newTab) => {
  if (newTab !== 'all') {
    selectedMenuItem.value = 'All Items';
  }
});

// --- Fetch Logic ---
const fetchCommunityReviews = async () => {
  try {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    communityReviews.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching community reviews:", error);
  }
};

function resetReviewsSubscription() {
  unsubscribeReviews?.();
  unsubscribeReviews = null;
}

onMounted(() => {
  fetchCommunityReviews().then(() => {
    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      resetReviewsSubscription();

      if (!user) {
        loading.value = false;
        myReviews.value = [];
        return;
      }

      unsubscribeReviews = subscribeToReviewsByUserId(
        user.uid,
        (nextReviews) => {
          myReviews.value = nextReviews;
          loading.value = false;
        },
        (error) => {
          console.error('Error fetching my reviews:', error);
          loading.value = false;
        }
      );
    });
  });
});

onUnmounted(() => {
  unsubscribeAuth?.();
  resetReviewsSubscription();
});

// --- Helper Functions for UI ---
const renderStars = (rating) => {
  const safeRating = Number(rating || 0);
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Singapore',
  }).format(date);
};

const formatName = (email) => {
  if (!email) return 'Anonymous';
  return email.split('@')[0];
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

/* --- TABS & FILTER STYLING --- */
.tabs-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  flex-wrap: wrap;
  gap: 16px;
}

.tabs-container {
  display: flex;
  gap: 12px;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 1.05rem;
  font-weight: bold;
  color: #888;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f9f9f9;
  color: #444;
}

.tab-btn.active {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: #666;
}

.styled-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: white;
  color: #333;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
}

.styled-select:focus {
  border-color: #f77519;
}

/* --- CARDS STYLING --- */
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
  display: flex;
  justify-content: space-between;
}

.reviewer-name {
  color: #ea580c;
  font-weight: bold;
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
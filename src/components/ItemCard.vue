<template>
  <div :class="['item-card', {'out-of-stock': quantity === 0}]">
    <img :src="imageSrc" alt="Item Image" />

    <div class="item-content">
      <div class="item-header">
        <h3>{{ ItemName }}</h3>
        <h3 class="price">${{ Price }}</h3>
      </div>

      <p>{{ ItemCategory }}</p>
      <p>{{ ItemDescription }}</p>

      <div class="review-summary">
        <template v-if="reviewSummary?.reviewCount">
          <p class="review-rating">
            {{ renderStars(reviewSummary.averageRating) }}
            <span class="review-rating-text">
              {{ reviewSummary.averageRating.toFixed(1) }} / 5 ·
              {{ reviewSummary.reviewCount }} review{{ reviewSummary.reviewCount === 1 ? '' : 's' }}
            </span>
          </p>

          <div class="review-snippets">
            <p
              v-for="review in reviewSummary.recentReviews"
              :key="review.id"
              class="review-snippet"
            >
              "{{ truncateReview(review.text) }}"
            </p>
          </div>
        </template>

        <p v-else class="no-reviews">No reviews yet</p>
      </div>

      <button id="add-to-cart" @click="addToCart" :disabled="quantity === 0">+ Add to Cart</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

const props = defineProps({
  id: String,
  ItemName: String,
  Price: Number,
  ItemCategory: String,
  ItemDescription: String,
  imageUrl: String,
  quantity: Number,
  reviewSummary: {
    type: Object,
    default: null,
  },
});

const imageSrc = computed(() => props.imageUrl)

function renderStars(rating) {
  const roundedRating = Math.round(Number(rating || 0))
  return '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating)
}

function truncateReview(text) {
  const reviewText = String(text || '').trim()

  if (reviewText.length <= 80) {
    return reviewText
  }

  return `${reviewText.slice(0, 77)}...`
}

async function addToCart() {
  const user = auth.currentUser

  if (!user) {
    alert('Please log in to add items to your cart.')
    return
  }

  const cartRef = doc(db, 'carts', user.uid)
  const cartSnap = await getDoc(cartRef)

  const newItem = {
    menuItemId: props.id,
    name: props.ItemName,
    price: props.Price,
    category: props.ItemCategory,
    imageUrl: props.imageUrl,
    quantity: 1,
  }

  try {
    if (cartSnap.exists()) {
      await updateDoc(cartRef, {
        items: arrayUnion(newItem),
      })
    } else {
      await setDoc(cartRef, {
        items: [newItem],
      })
    }

    alert(`${props.ItemName} added to cart.`)
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}
</script>

<style scoped>
.item-card {
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin: 1em;
  border-radius: 1.5em;
  width: 20em;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
}

.item-card img {
  width: 100%;
  height: 15rem;
  object-fit: cover;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.75rem 1rem;
  flex: 1;
}

.item-header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.item-card h3,
.item-card p,
.review-rating,
.review-snippet,
.no-reviews {
  margin: 0;
}

.price {
  color: var(--col-main);
  font-weight: normal;
}

.out-of-stock {
  opacity: 0.6;
  filter: grayscale(80%);
  border-color: #eee;
}

.review-summary {
  margin-top: 0.5rem;
  padding: 0.8rem;
  border-radius: 0.9rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.review-rating {
  color: #ea580c;
  font-weight: 700;
}

.review-rating-text {
  color: #7c2d12;
  font-size: 0.92rem;
}

.review-snippets {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

.review-snippet,
.no-reviews {
  color: #7c2d12;
  font-size: 0.92rem;
  line-height: 1.4;
}

.no-reviews {
  color: #9a3412;
}

#add-to-cart {
  margin-top: auto;
  margin-bottom: 0.5em;
  align-self: center;
  background-color: var(--col-main);
  color: white;
  border: none;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.8em;
  cursor: pointer;
  font-size: 1.1em;
}

#add-to-cart:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

#add-to-cart:hover {
  background-color: var(--col-hover);
}

</style>
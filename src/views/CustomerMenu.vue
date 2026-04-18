<template>
  <NavCustomer />
  <div class="customer-menu">
    <h1 class="header">Menu</h1>

    <nav class="category-tabs">
      <button
        v-for="category in categories"
        :key="category"
        class="category-buttons"
        :class="{ active: activeCategory === category }"
        @click="activeCategory = category"
      >
        {{ category }}
      </button>
    </nav>

    <p v-if="filteredItems.length === 0">No items available in this category.</p>

    <div class="menu-items">
      <ItemCard
        v-for="item in filteredItems"
        :key="item.id"
        :id="item.id"
        :ItemName="item.ItemName"
        :Price="item.Price"
        :ItemCategory="item.ItemCategory"
        :ItemDescription="item.ItemDescription"
        :imageUrl="item.imageUrl"
        :quantity="item.quantity"
        :review-summary="reviewSummaries[item.id]"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import ItemCard from '@/components/ItemCard.vue'
import NavCustomer from '@/components/NavCustomer.vue'
import { db } from '@/firebase'
import { buildMenuItemReviewSummaries, subscribeToAllReviews } from '@/services/reviewService'

const categories = ['All', 'Main Course', 'Bakery', 'Desserts', 'Salads', 'Beverages']
const menuItems = ref([])
const reviewSummaries = ref({})
const activeCategory = ref('All')

let unsubscribeReviews = null

const filteredItems = computed(() => {
  if (activeCategory.value === 'All') {
    return menuItems.value
  }

  return menuItems.value.filter((item) => item.ItemCategory === activeCategory.value)
})

async function getItems() {
  const snapshot = await getDocs(collection(db, 'MenuItems'))
  return snapshot.docs.map((menuItemDoc) => ({ id: menuItemDoc.id, ...menuItemDoc.data() }))
}

onMounted(async () => {
  menuItems.value = await getItems()

  unsubscribeReviews = subscribeToAllReviews(
    (reviews) => {
      reviewSummaries.value = buildMenuItemReviewSummaries(reviews)
    },
    (error) => {
      console.error('Error loading menu item reviews:', error)
    },
  )
})

onUnmounted(() => {
  unsubscribeReviews?.()
})
</script>

<style scoped>
.customer-menu {
  padding: 2rem;
}

.header {
  margin-bottom: 1rem;
}

.menu-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 10px;
  width: 100%;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  margin-left: 2%;
  flex-wrap: wrap;
}

.category-buttons {
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  background-color: white;
  border-radius: 100px;
  font-weight: bold;
  color: var(--text-main);
}

.category-buttons.active {
  background-color: var(--col-main);
  color: white;
}
</style>

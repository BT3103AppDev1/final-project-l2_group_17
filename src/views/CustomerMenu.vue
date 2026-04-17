<template>
  <NavCustomer />
  <div class="customer-menu">
    <h1 style="padding: 0px 1%;">Menu</h1>
<nav class="category-tabs">
      <button class="category-buttons"
        v-for="category in categories" 
        :key="category"
        @click="activeCategory = category"
        :class="{ active: activeCategory === category }"
      >
        {{ category }}
      </button>
    </nav>
    <p v-if="filteredItems.length === 0">No items available in this category.</p>
    <div class="menu-items">
      <ItemCard
        v-for="item in filteredItems"
        :key="item.id"
        :ItemName="item.ItemName"
        :Price="item.Price"
        :ItemCategory="item.ItemCategory"
        :ItemDescription="item.ItemDescription"
        :imageUrl="item.imageUrl"
        :quantity="item.quantity"
      />
    </div>
      <div v-if="activeCategory === 'Mains'">
        <h2>Delicious Mains</h2>
        <p>List of mains goes here...</p>
      </div>
  </div>
</template>

<script setup>
import ItemCard from '@/components/ItemCard.vue';
import NavCustomer from '@/components/NavCustomer.vue';
import { onMounted, ref, computed } from 'vue';
import { db } from '@/firebase';
import { getDocs } from 'firebase/firestore';
import { collection } from 'firebase/firestore';

const categories = ['All', 'Main Course', 'Bakery', 'Desserts', 'Salads', 'Beverages'];
const menuItems = ref([]);
const activeCategory = ref('All');
const filteredItems = computed(() => {
  if (activeCategory.value === 'All') {
    return menuItems.value
  }
  return menuItems.value.filter(item => item.ItemCategory === activeCategory.value)
})

async function getItems() {
  const snapshot = await getDocs(collection(db, 'MenuItems'));
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(items);
  return items;
}

onMounted(async () => {
  const items = await getItems();
  menuItems.value = items;
});

</script>

<style scoped>
.menu-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 10px;
  width: 100%;
}

.category-tabs {
  padding: 0px 1%;
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.category-buttons {
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  background-color: white;
  border-radius: 100px;
}

.category-buttons.active {
  background-color: var(--col-main);
  color: white;
}

.category-buttons:hover {
  background-color: var(--col-main);
  color: white;
}


</style>
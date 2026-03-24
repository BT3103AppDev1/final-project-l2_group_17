<template>
  <div class="customer-menu">
    <h1>Menu</h1>
    <div class="menu-items">
      <ItemCard
        v-for="item in menuItems"
        :key="item.id"
        :ItemName="item.ItemName"
        :Price="item.Price"
        :ItemCategory="item.ItemCategory"
        :ItemDescription="item.ItemDescription"
      />
    </div>
  </div>
</template>

<script setup>
import ItemCard from '@/components/ItemCard.vue';
import { onMounted, ref } from 'vue';
import { db } from '@/firebase';
import { getDocs } from 'firebase/firestore';
import { collection } from 'firebase/firestore';

const menuItems = ref([]);

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
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 20px;
  width: 100%;
}
</style>
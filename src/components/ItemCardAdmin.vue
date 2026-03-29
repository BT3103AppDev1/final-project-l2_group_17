<template>
  <div class="item-card-admin">
    <img :src="imageSrc" alt="Item Image" />

    <div class="item-content">
      <div class="item-header">
        <h3>{{ ItemName }}</h3>
        <h3 class="price">${{ displayPrice }}</h3>
      </div>

      <p class="item-category">{{ ItemCategory }}</p>
      <p class="item-description">{{ ItemDescription }}</p>

      <div class="actions">
        <button type="button" class="btn-edit" @click="onEdit">✎ Edit</button>
        <button type="button" class="btn-delete" @click="onDelete">🗑 Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  id: String,
  ItemName: String,
  Price: Number,
  ItemCategory: String,
  ItemDescription: String,
  imageUrl: String,
});

const emit = defineEmits(["edit", "delete"]);

const imageSrc = computed(() => props.imageUrl);

const displayPrice = computed(() => {
  const numericPrice = Number(props.Price);
  if (Number.isNaN(numericPrice)) {
    return props.Price;
  }

  return numericPrice.toFixed(2);
});

function onEdit() {
  emit("edit", props.id);
}

function onDelete() {
  emit("delete", props.id);
}
</script>

<style scoped>
.item-card-admin {
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 1.5em;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #efeff2;
}

.item-card-admin img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.item-content {
  padding: 18px 26px 24px;
}

.item-header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.price {
  color: #f77519;
  font-weight: 200;
  white-space: nowrap;
}

.item-card-admin h3 {
  margin: 0;
  font-size: 30px;
  line-height: 1.05;
}

.item-category {
  margin: 8px 0 0;
  color: #555a68;
  font-size: 16px;
}

.item-description {
  margin: 10px 0 0;
  color: #4d4f59;
  font-size: 18px;
  line-height: 1.4;
}

.actions {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-edit,
.btn-delete {
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
}

.btn-edit {
  background: #2e7be8;
}

.btn-delete {
  background: #ff2c3a;
}
</style>

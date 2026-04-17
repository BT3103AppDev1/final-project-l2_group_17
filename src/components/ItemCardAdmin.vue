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
  border: 1px solid rgba(91, 57, 36, 0.12);
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
  border-radius: 24px;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
}

.item-card-admin img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.item-content {
  padding: 18px 20px 20px;
}

.item-header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.price {
  color: var(--col-main);
  font-weight: 700;
  white-space: nowrap;
}

.item-card-admin h3 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.3;
  color: var(--text-main);
}

.item-category {
  margin: 8px 0 0;
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 600;
}

.item-description {
  margin: 10px 0 0;
  color: var(--text-main);
  font-size: 0.98rem;
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
  border-radius: 999px;
  color: #fff8ef;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 10px 14px;
  cursor: pointer;
}

.btn-edit {
  background: #1f4b87;
}

.btn-delete {
  background: var(--delete-color);
}
</style>

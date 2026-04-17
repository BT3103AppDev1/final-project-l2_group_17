<template>
  <div :class="['item-card', {'out-of-stock': quantity === 0}]">
    <img :src="imageSrc" alt="Item Image" />
      <div class="item-header">
        <h3>{{ ItemName }}</h3>
        <h3 class="price">${{ Price }}</h3>
      </div>
      <p>{{ ItemCategory }}</p>
      <p>{{ ItemDescription }}</p>
    <button id="add-to-cart" @click="addToCart"; :disabled="quantity === 0">+ Add to Cart</button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  ItemName: String,
  Price: Number,
  ItemCategory: String,
  ItemDescription: String,
  imageUrl: String,
  quantity: Number
});

const imageSrc = computed(() => props.imageUrl 
);

function addToCart() {
  console.log("Added to cart");
}
</script>

<style scoped>
.item-card {
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin: 1em;
  border-radius: 1.5em;
  height: 30em;
  width: 20em;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.item-card img {
  width: 100%;
  height: 70%;
  object-fit: cover;
  padding: none;
  margin: none;
  border-radius: 1.5em 1.5em 0 0;
}

.item-header {
  display: flex;
  width: 97%;
  justify-content: space-between;
  align-items: center;
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

#add-to-cart {
  margin-top: auto;
  margin-bottom: 0.5em;
  align-self: center;
  background-color: var(--col-main);
  color: white;
  border: none;
  height: 10%;
  width: 90%;
  padding: 0.5em 1em;
  border-radius: 0.8em;
  cursor: pointer;
  font-size: 1.2em;
}

#add-to-cart:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

#add-to-cart:hover {
  background-color: var(--col-hover);
}

.item-card h3 {
  margin: 0.25em 0 0 0.5em;
}

.item-card p {
  margin: 0.25em 0 0.5em 0.5em;
}

</style>
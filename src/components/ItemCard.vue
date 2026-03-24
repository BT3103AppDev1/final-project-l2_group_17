<template>
  <div class="item-card">
    <img src="https://i.imgflip.com/45zos6.jpg" alt="Item Image" />
    <div class="item-info">
      <h3>Item Name</h3>
      <p>Item Category</p>
      <p>Item Description</p>
    </div>
    <button id="add-to-cart" @click="addToCart">+ Add to Cart</button>
  </div>
</template>

<script setup>
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
  height: auto;
  padding: none;
  margin: none;
  border-radius: 1.5em 1.5em 0 0;
}

#add-to-cart {
  margin-top: auto;
  margin-bottom: 0.5em;
  align-self: center;
  background-color: #f77519;
  color: white;
  border: none;
  height: 10%;
  width: 90%;
  padding: 0.5em 1em;
  border-radius: 1em;
  cursor: pointer;
  font-size: 1.2em;
}

#add-to-cart:hover {
  background-color: #e66a17;
}

.item-card h3 {
    margin: 0.25em 0 0 0.5em;
}

.item-card p {
    margin: 0.25em 0 0 0.5em;
}
</style>

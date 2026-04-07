<template>
  <div class="item-card">
    <img :src="imageSrc" alt="Item Image" />
      <div class="item-header">
        <h3>{{ ItemName }}</h3>
        <h3 class="price">${{ Price }}</h3>
      </div>
      <p>{{ ItemCategory }}</p>
      <p>{{ ItemDescription }}</p>
    <button id="add-to-cart" @click="addToCart">+ Add to Cart</button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { db, auth } from '@/firebase'; //
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const props = defineProps({
  id: String, // Ensure you pass the item ID from CustomerMenu
  ItemName: String,
  Price: Number,
  ItemCategory: String,
  ItemDescription: String,
  imageUrl: String
});

const imageSrc = computed(() => props.imageUrl);

async function addToCart() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to add items to your cart!");
    return;
  }

  const cartRef = doc(db, 'carts', user.uid); // Path: carts/USER_ID
  const cartSnap = await getDoc(cartRef);

  const newItem = {
    menuItemId: props.id,
    name: props.ItemName,
    price: props.Price,
    category: props.ItemCategory,
    imageUrl: props.imageUrl,
    quantity: 1
  };

  try {
    if (cartSnap.exists()) {
      // If cart exists, add the item to the existing array
      await updateDoc(cartRef, {
        items: arrayUnion(newItem)
      });
    } else {
      // If no cart exists, create it
      await setDoc(cartRef, {
        items: [newItem]
      });
    }
    alert(`${props.ItemName} added to cart!`);
  } catch (error) {
    console.error("Error adding to cart:", error);
  }
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
  color: #f77519;
  font-weight: normal;
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
  border-radius: 0.8em;
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

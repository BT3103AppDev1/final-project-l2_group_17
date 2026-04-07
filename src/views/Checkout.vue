<template>
  <div class="checkout-container">
    <h1 class="page-title">Shopping Cart</h1>

    <div v-if="cartItems.length > 0" class="checkout-layout">
      <div class="items-section">
        <div v-for="item in cartItems" :key="item.menuItemId" class="cart-card">
          <img :src="item.imageUrl || 'https://placehold.co/400x400?text=Food'" class="item-img" />
          
          <div class="item-info">
            <div class="header-row">
              <h3>{{ item.name }}</h3>
              <button @click="removeItem(item.menuItemId)" class="delete-btn">🗑️</button>
            </div>
            <p class="category">{{ item.category || 'Main Course' }}</p>
            
            <div class="controls-row">
              <div class="qty-selector">
                <button @click="updateQty(item.menuItemId, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQty(item.menuItemId, 1)">+</button>
              </div>
              <span class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Total</span>
          <span class="total-price">${{ totalAmount.toFixed(2) }}</span>
        </div>
        
        <button class="pickup-btn" @click="submitOrder" :disabled="isSubmitting">
          <span v-if="!isSubmitting">📅 Schedule Pickup</span>
          <span v-else>Processing...</span>
        </button>
        
        <router-link to="/customer/menu" class="continue-link">Continue Shopping</router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🛒</div>
      <p>Your cart is currently empty.</p>
      <router-link to="/customer/menu" class="browse-btn">Browse Menu</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { auth, db } from '@/firebase'; // Using your firebase.js exports
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'vue-router';

const router = useRouter();

// 1. Reactive Data (Currently Mocked - but ready for your Menu data)
const cartItems = ref([
  {
    menuItemId: 'main-001',
    name: 'Homemade Lasagna',
    category: 'Main Course',
    price: 18.99,
    quantity: 1,
    imageUrl: '' 
  },
  {
    menuItemId: 'bread-001',
    name: 'Artisan Sourdough Bread',
    category: 'Bakery',
    price: 8.99,
    quantity: 1,
    imageUrl: ''
  }
]);

const isSubmitting = ref(false);

// 2. Calculations
const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// 3. Logic Functions
const updateQty = (id, change) => {
  const item = cartItems.value.find(i => i.menuItemId === id);
  if (item) item.quantity = Math.max(1, item.quantity + change);
};

const removeItem = (id) => {
  cartItems.value = cartItems.value.filter(i => i.menuItemId !== id);
};

// 4. Submit Order (Linked to Firebase Auth)
const submitOrder = async () => {
  const user = auth.currentUser; // Grabs real user from your Firebase Auth session

  if (!user) {
    alert("Please log in to place an order.");
    router.push('/');
    return;
  }

  isSubmitting.value = true;
  try {
    // Creating the 'Order Draft' for the Order Management team
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      customerEmail: user.email,
      items: cartItems.value,
      total: totalAmount.value,
      status: 'pending',
      orderDate: serverTimestamp(),
      orderType: 'pickup'
    });
    
    alert('Order placed successfully!');
    cartItems.value = []; 
  } catch (error) {
    console.error("Order submission error:", error);
    alert('Failed to place order.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.checkout-container { padding: 40px; max-width: 1000px; margin: 0 auto; font-family: sans-serif; }
.page-title { font-size: 2rem; font-weight: bold; margin-bottom: 30px; color: #333; }

.checkout-layout { display: flex; gap: 30px; align-items: flex-start; }
.items-section { flex: 2; display: flex; flex-direction: column; gap: 15px; }

/* Item Card Styling (Matches Image) */
.cart-card { 
  background: white; 
  border-radius: 16px; 
  display: flex; 
  padding: 16px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #eee;
}

.item-img { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; }
.item-info { flex-grow: 1; margin-left: 20px; display: flex; flex-direction: column; justify-content: space-between; }

.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-row h3 { margin: 0; font-size: 1.1rem; color: #222; }
.delete-btn { background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 1.2rem; }

.category { color: #888; font-size: 0.9rem; margin: 4px 0 12px 0; }

.controls-row { display: flex; justify-content: space-between; align-items: center; }
.qty-selector { 
  background: #f5f5f5; 
  border-radius: 10px; 
  padding: 6px 12px; 
  display: flex; 
  align-items: center; 
  gap: 20px; 
  border: 1px solid #ddd;
}
.qty-selector button { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #555; }

.item-price { color: #f77519; font-weight: bold; font-size: 1.1rem; }

/* Summary Card Styling */
.summary-card { 
  flex: 1; 
  background: white; 
  border-radius: 20px; 
  padding: 24px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  border: 1px solid #eee;
  position: sticky;
  top: 20px;
}

.summary-row { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
.total-price { color: #f77519; font-weight: bold; font-size: 1.4rem; }

.pickup-btn { 
  background: #f77519; /* Matching your Menu theme */
  color: white; 
  border: none; 
  width: 100%; 
  padding: 14px; 
  border-radius: 12px; 
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer; 
  transition: background 0.3s;
}
.pickup-btn:disabled { background: #ccc; cursor: not-allowed; }

.continue-link { display: block; text-align: center; margin-top: 20px; color: #666; text-decoration: none; font-size: 0.9rem; }
.continue-link:hover { text-decoration: underline; }

.empty-state { text-align: center; padding: 100px 0; }
.empty-icon { font-size: 4rem; margin-bottom: 20px; }
.browse-btn { background: #f77519; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; }
</style>
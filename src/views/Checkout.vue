<template>
  <div class="checkout-container">
    <h1 class="page-title">Shopping Cart</h1>

    <div v-if="cartItems.length > 0" class="checkout-layout">
      <div class="items-section">
        <div v-for="item in cartItems" :key="item.menuItemId" class="cart-card">
          <img src="@/assets/bread.jpg" alt="item.name" class="item-img" />
          
          <div class="item-info">
            <div class="header-row">
              <h3>{{ item.name }}</h3>
              <button @click="removeItem(item.menuItemId)" class="delete-btn">🗑️</button>
            </div>
            <p class="category">Bakery</p>
            
            <div class="controls-row">
              <div class="qty-selector">
                <button @click="updateQty(item.menuItemId, -1)">-</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQty(item.menuItemId, 1)">+</button>
              </div>
              <span class="price">${{ (item.price * item.quantity).toFixed(2) }}</span>
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
          {{ isSubmitting ? 'Processing...' : '📅 Schedule Pickup' }}
        </button>
        
        <router-link to="/customer/menu" class="continue-link">Continue Shopping</router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Your cart is currently empty.</p>
      <router-link to="/customer/menu">Browse Menu</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
// import { createOrder } from '@/services/orderService';
// Assuming you have a way to get the current user, e.g., via a store
// import { useUserStore } from '@/stores/user'; 

// 1. Reactive Data
const cartItems = ref([
  {
    menuItemId: 'bread-001',
    name: 'Artisan Sourdough Bread',
    price: 8.99,
    quantity: 1
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
  if (item) {
    item.quantity = Math.max(1, item.quantity + change);
  }
};

const removeItem = (id) => {
  cartItems.value = cartItems.value.filter(i => i.menuItemId !== id);
};

// 4. Handoff to Order Management Team
const submitOrder = async () => {
  isSubmitting.value = true;
  try {
    // You would replace 'currentUser' with your actual Auth state
    await createOrder({
      userId: 'test-user-id', 
      customerName: 'Jane Customer',
      customerEmail: 'jane@example.com',
      phoneNumber: '91234567',
      items: cartItems.value, // This is your array
      notes: '',
      orderType: 'pickup',
      scheduledTime: new Date().toISOString(),
      paymentMethod: 'card',
      transactionToken: 'token_123',
      paymentStatus: 'paid',
    });
    
    alert('Order placed successfully!');
    cartItems.value = []; // Clear cart after success
  } catch (error) {
    console.error("Order failed:", error);
    alert('Error placing order.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.checkout-layout { display: flex; gap: 20px; padding: 20px; justify-content: center; }
.cart-card { background: white; border-radius: 15px; display: flex; padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); width: 450px; }
.item-img { width: 100px; height: 100px; border-radius: 10px; object-fit: cover; }
.item-info { flex-grow: 1; margin-left: 15px; }
.qty-selector { background: #f0f0f0; border-radius: 8px; padding: 5px 10px; display: flex; align-items: center; gap: 15px; }
.summary-card { background: white; border-radius: 15px; padding: 20px; width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); height: fit-content; }
.pickup-btn { background: #e67e22; color: white; border: none; width: 100%; padding: 12px; border-radius: 10px; cursor: pointer; margin-top: 15px; }
.total-price { color: #e67e22; font-weight: bold; font-size: 1.2rem; }
</style>
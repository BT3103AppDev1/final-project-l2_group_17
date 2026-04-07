<template>
  <NavCustomer /> 
  <div class="schedule-container">
    <h1 class="page-title">Schedule Pickup</h1>

    <div class="schedule-layout">
      <div class="forms-column">
        <section class="details-card">
          <h3>Pickup Details</h3>
          
          <div class="form-group">
            <label><span class="icon">📅</span> Pickup Date</label>
            <input type="date" v-model="pickupDate" :min="minDate" class="styled-input">
          </div>

          <div class="form-group">
            <label><span class="icon">🕒</span> Pickup Time</label>
            <select v-model="pickupTime" class="styled-input">
              <option value="" disabled>Select a time</option>
              <option v-for="time in timeSlots" :key="time" :value="time">{{ time }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Special Instructions (Optional)</label>
            <textarea 
              v-model="notes" 
              placeholder="Any dietary restrictions or special requests?"
              class="styled-textarea"
            ></textarea>
          </div>
        </section>

        <section class="info-card">
          <h3>Your Information</h3>
          <div class="info-row">
            <span>Name</span>
            <strong>{{ customerName }}</strong>
          </div>
          <div class="info-row">
            <span>Email</span>
            <strong>{{ customerEmail }}</strong>
          </div>
          <div class="info-row">
            <span>Phone</span>
            <input type="tel" v-model="phoneNumber" placeholder="555-0100" class="inline-input">
          </div>
        </section>
      </div>

      <aside class="summary-column">
        <div class="order-summary-card">
          <h3>Order Summary</h3>
          <ul class="item-list">
            <li v-for="item in cartItems" :key="item.menuItemId">
              {{ item.name }} x{{ item.quantity }} 
              <span class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </li>
          </ul>
          
          <div class="total-row">
            <span>Total</span>
            <span class="total-amount">${{ totalAmount.toFixed(2) }}</span>
          </div>

          <button @click="placeOrder" :disabled="!isFormValid || isSubmitting" class="place-order-btn">
            {{ isSubmitting ? 'Processing...' : 'Place Order' }}
          </button>
          <p class="payment-note">Payment will be collected at pickup</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { auth, db } from '@/firebase'; //
import { collection, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import NavCustomer from '@/components/NavCustomer.vue';

const router = useRouter();

// --- Data State ---
const cartItems = ref([]);
const pickupDate = ref('');
const pickupTime = ref('');
const notes = ref('');
const phoneNumber = ref('');
const isSubmitting = ref(false);

// Using teammate's logic for min date (today)
const today = new Date();
const minDate = today.toISOString().split('T')[0];

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

// --- Auth Data ---
const customerName = ref('Loading...');
const customerEmail = ref('Loading...');

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) {
    router.push('/');
    return;
  }

  // 1. Load User Info from Firestore
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    customerName.value = userDoc.data().name || 'Jane Customer';
    customerEmail.value = user.email;
  }

  // 2. Load Cart from Firestore
  const cartSnap = await getDoc(doc(db, 'carts', user.uid));
  if (cartSnap.exists()) {
    cartItems.value = cartSnap.data().items || [];
  } else {
    router.push('/customer/menu'); // Redirect if cart empty
  }
});

// --- Calculations ---
const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const isFormValid = computed(() => {
  return pickupDate.value && pickupTime.value && cartItems.value.length > 0;
});

// --- Actions ---
const placeOrder = async () => {
  const user = auth.currentUser;
  isSubmitting.value = true;

  try {
    // 1. Create the Final Order with Status History
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      phoneNumber: phoneNumber.value,
      items: cartItems.value,
      total: totalAmount.value,
      pickupDate: pickupDate.value,
      pickupTime: pickupTime.value,
      notes: notes.value,
      status: 'pending', 
      // This allows CustomerOrders.vue to show the "Status history" timeline
      statusHistory: [ 
        {
          status: 'pending',
          updatedAt: new Date().toLocaleString(),
          updatedBy: 'system'
        }
      ],
      createdAt: serverTimestamp()
    });

    // 2. Clear the Cart in Firestore so the user can shop again
    await deleteDoc(doc(db, 'carts', user.uid));

    alert('Order placed successfully!');
    
    // 3. Redirect to the Orders History page instead of the menu
    router.push('/customer/my_orders'); 
  } catch (error) {
    console.error("Order error:", error);
    alert('Failed to place order.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.schedule-container { padding: 40px; max-width: 1100px; margin: 0 auto; font-family: sans-serif; }
.page-title { font-size: 2.5rem; margin-bottom: 30px; }

.schedule-layout { display: grid; grid-template-columns: 1fr 350px; gap: 30px; }

.details-card, .info-card, .order-summary-card {
  background: white; border-radius: 16px; padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eee; margin-bottom: 20px;
}

h3 { margin-top: 0; font-size: 1.4rem; margin-bottom: 20px; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #444; }
.icon { margin-right: 8px; color: #f97316; }

.styled-input, .styled-textarea, .inline-input {
  width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;
}
.styled-textarea { height: 100px; resize: none; }

.info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
.inline-input { width: 150px; padding: 4px 8px; }

.item-list { list-style: none; padding: 0; margin-bottom: 20px; border-bottom: 1px solid #eee; }
.item-list li { display: flex; justify-content: space-between; margin-bottom: 10px; color: #555; }
.item-price { font-weight: bold; color: #333; }

.total-row { display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: bold; margin-bottom: 25px; }
.total-amount { color: #f97316; }

.place-order-btn {
  width: 100%; background: #f97316; color: white; border: none; padding: 16px;
  border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer;
}
.place-order-btn:disabled { background: #ccc; }

.payment-note { text-align: center; color: #888; font-size: 0.85rem; margin-top: 15px; }
</style>
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
            <input
              type="date"
              v-model="pickupDate"
              :min="minDate"
              class="styled-input"
            />
          </div>

          <div class="form-group">
            <label><span class="icon">🕒</span> Pickup Time</label>
            <select v-model="pickupTime" class="styled-input">
              <option value="" disabled>Select a time</option>
              <option v-for="time in timeSlots" :key="time" :value="time">
                {{ time }}
              </option>
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
            <input
              type="tel"
              v-model="phoneNumber"
              placeholder="555-0100"
              class="inline-input"
            />
          </div>
        </section>
      </div>

      <aside class="summary-column">
        <div class="order-summary-card">
          <h3>Order Summary</h3>
          <ul class="item-list">
            <li v-for="item in cartItems" :key="item.menuItemId">
              {{ item.name }} x{{ item.quantity }}
              <span class="item-price"
                >${{ (item.price * item.quantity).toFixed(2) }}</span
              >
            </li>
          </ul>

          <div class="total-row">
            <span>Subtotal</span>
            <span class="total-amount">${{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>Discount</span>
            <span class="total-amount">-${{ discount.toFixed(2) }}</span>
          </div>        

          <div class="total-row">
            <span>Total</span>
            <span class="total-amount">${{ (totalAmount - discount).toFixed(2) }}</span>
          </div>
          <div>
            <label for="points">Use Loyalty Points:</label>
            <input
              type="number"
              id="points"
              v-model.number="pointsToUse"
              min="0"
              :max="customerPoints"
              class="inline-input"
            />
          </div>
          <button
            @click="placeOrder"
            :disabled="!isFormValid || isSubmitting"
            class="place-order-btn"
          >
            {{ isSubmitting ? "Processing..." : "Place Order" }}
          </button>
          <p class="payment-note">Payment will be collected at pickup</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { auth, db } from "@/firebase"; //
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "vue-router";
import NavCustomer from "@/components/NavCustomer.vue";
import { createOrder } from "@/services/orderservice";

const router = useRouter();

// --- Data State ---
const cartItems = ref([]);
const pickupDate = ref("");
const pickupTime = ref("");
const notes = ref("");
const phoneNumber = ref("");
const isSubmitting = ref(false);
const customerPoints = ref(0);
const pointsToUse = ref(0);
const pointValue = 0.1;
const discount = computed(() => pointsToUse.value * pointValue);

// Using teammate's logic for min date (today)
const today = new Date();
const minDate = today.toISOString().split("T")[0];

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

// --- Auth Data ---
const customerName = ref("Loading...");
const customerEmail = ref("Loading...");

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) {
    router.push("/");
    return;
  }

  // 1. Load User Info from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    customerName.value = userDoc.data().name || "Jane Customer";
    customerEmail.value = user.email;
    customerPoints.value = userDoc.data().points || 0;
  }

  // 2. Load Cart from Firestore
  const cartSnap = await getDoc(doc(db, "carts", user.uid));
  if (cartSnap.exists()) {
    cartItems.value = cartSnap.data().items || [];
  } else {
    router.push("/customer/menu"); // Redirect if cart empty
  }
});

// --- Calculations ---
const totalAmount = computed(() => {
  return cartItems.value.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
});

const isFormValid = computed(() => {
  return pickupDate.value && pickupTime.value && cartItems.value.length > 0;
});

//parse the date/time inputs for safari browser compatibility and to ensure we get a valid Date object for the scheduled pickup time
const buildScheduledDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;

  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!dateMatch || !timeMatch) {
    throw new Error("Invalid pickup date or time format.");
  }

  const [, year, month, day] = dateMatch;
  const [, rawHour, minute, meridiem] = timeMatch;

  let hour = Number(rawHour);
  if (Number.isNaN(hour)) {
    throw new Error("Invalid pickup hour.");
  }

  const normalizedMeridiem = meridiem.toUpperCase();
  if (normalizedMeridiem === "PM" && hour < 12) hour += 12;
  if (normalizedMeridiem === "AM" && hour === 12) hour = 0;

  const scheduled = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    Number(minute),
    0,
    0,
  );

  if (Number.isNaN(scheduled.getTime())) {
    throw new Error("Failed to build a valid pickup time.");
  }

  return scheduled;
};

// --- Actions ---
const placeOrder = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Your session has expired. Please sign in again.");
    router.push("/");
    return;
  }

  isSubmitting.value = true;

  try {
    const scheduledTime = buildScheduledDateTime(
      pickupDate.value,
      pickupTime.value,
    );

    await createOrder({
      userId: user.uid,
      customerName: customerName.value,
      customerEmail: customerEmail.value,
      phoneNumber: phoneNumber.value,
      items: cartItems.value,
      discount: discount.value,
      scheduledTime,
      notes: notes.value,
      orderType: "pickup",
    });

    const newPointsBalance = Math.max(0, customerPoints.value - pointsToUse.value + totalAmount.value - discount.value);
    await deleteDoc(doc(db, "carts", user.uid));
    await updateDoc(doc(db, "users", user.uid), {
      points: newPointsBalance,
    });
    alert("Order placed successfully!");

    router.push("/customer/my_orders");
  } catch (error) {
    console.error("Order error:", error);
    const errorMessage =
      error?.message || "Unknown error while creating order.";
    alert(`Failed to place order: ${errorMessage}`);
  } finally {
    isSubmitting.value = false;
  }
};

watch(pointsToUse, (newValue) => {
  if (newValue > customerPoints.value) {
    pointsToUse.value = customerPoints.value;
  }
  if (newValue < 0) {
    pointsToUse.value = 0;
  }
});

</script>

<style scoped>
.schedule-container {
  padding: 40px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: sans-serif;
}
.page-title {
  font-size: 2.5rem;
  margin-bottom: 30px;
}

.schedule-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
}

.details-card,
.info-card,
.order-summary-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  margin-bottom: 20px;
}

h3 {
  margin-top: 0;
  font-size: 1.4rem;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
}
.icon {
  margin-right: 8px;
  color: #f97316;
}

.styled-input,
.styled-textarea,
.inline-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}
.styled-textarea {
  height: 100px;
  resize: none;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.inline-input {
  width: 150px;
  padding: 4px 8px;
}

.item-list {
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.item-list li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #555;
}
.item-price {
  font-weight: bold;
  color: #333;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 25px;
}
.total-amount {
  color: #f97316;
}

.place-order-btn {
  width: 100%;
  background: #f97316;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}
.place-order-btn:disabled {
  background: #ccc;
}

.payment-note {
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  margin-top: 15px;
}
</style>

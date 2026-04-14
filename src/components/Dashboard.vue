<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { subscribeToAllOrders } from "@/services/orderservice";

const loading = ref(false);
const errorMessage = ref("");

const stats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
});

const todaysPickups = ref([]);
const unsubscribeOrders = ref(null);

// Placeholder review data (as requested)
const reviews = ref([
  {
    id: "r-1",
    customerName: "Jane Customer",
    rating: 5,
    comment: "Pickup was smooth and on time. Great service!",
  },
  {
    id: "r-2",
    customerName: "Mark Tan",
    rating: 4,
    comment: "Good communication and friendly delivery experience.",
  },
]);

const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(asNumber(value));

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate(); // Firestore Timestamp
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000); // serialized timestamp
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatTime = (dateObj) =>
  dateObj ? dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Time not set";

const getOrderTotal = (order) => {
  if (Number.isFinite(Number(order?.totalPrice))) return Number(order.totalPrice);
  return (order?.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const subtotal = Number(item.subtotal ?? quantity * price);
    return sum + (Number.isNaN(subtotal) ? 0 : subtotal);
  }, 0);
};

const applyOrdersToDashboard = (orders = []) => {
  const completed = orders.filter((o) => o.status === "completed");
  const pendingLike = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(String(o.status || "").trim())
  );

  stats.value = {
    totalRevenue: completed.reduce((sum, o) => sum + getOrderTotal(o), 0),
    totalOrders: orders.length,
    pendingOrders: pendingLike.length,
    completedOrders: completed.length,
  };

  const today = new Date();
  todaysPickups.value = orders
    .map((o, i) => {
      const pickupAt = parseDate(o.scheduledTime) || parseDate(o.pickupDateTime) || parseDate(o.pickupDate);
      return {
        id: o.id ?? o.orderId ?? `order-${i}`,
        customerName:
          o.customerName ||
          o.customer?.name ||
          o.userName ||
          `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim() ||
          "Customer",
        amount: getOrderTotal(o),
        pickupAt,
      };
    })
    .filter((o) => o.pickupAt && isSameDay(o.pickupAt, today))
    .sort((a, b) => a.pickupAt - b.pickupAt)
    .map((o) => ({
      id: o.id,
      customerName: o.customerName,
      amount: o.amount,
      timeLabel: formatTime(o.pickupAt),
    }));
};

const startSync = () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    unsubscribeOrders.value = subscribeToAllOrders(
      (nextOrders) => {
        applyOrdersToDashboard(Array.isArray(nextOrders) ? nextOrders : []);
        loading.value = false;
      },
      (err) => {
        console.error(err);
        errorMessage.value = err?.message || "Failed to load dashboard data.";
        loading.value = false;
      }
    );
  } catch (err) {
    console.error(err);
    errorMessage.value = err?.message || "Failed to load dashboard data.";
    loading.value = false;
  }
};

const router = useRouter();

const goToCalendarTab = async () => {
  try {
    await router.push({ name: "Admin Calendar" }); // matches router/index.js
  } catch {
    window.location.href = "/admin/calendar"; // fallback matches router path
  }
};

onMounted(startSync);

onUnmounted(() => {
  if (typeof unsubscribeOrders.value === "function") unsubscribeOrders.value();
});
</script>


<template>
  <div class="dashboard">
    <section class="stats-grid">
      <article class="stat-card">
        <div class="stat-head">
          <h3>Total Revenue</h3>
          <span class="icon icon-green">$</span>
        </div>
        <p class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</p>
        <p class="stat-sub">From completed orders</p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <h3>Total Orders</h3>
          <span class="icon icon-blue">📦</span>
        </div>
        <p class="stat-value">{{ stats.totalOrders }}</p>
        <p class="stat-sub">All time</p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <h3>Pending Orders</h3>
          <span class="icon icon-yellow">🕒</span>
        </div>
        <p class="stat-value">{{ stats.pendingOrders }}</p>
        <p class="stat-sub">Needs attention</p>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          <h3>Completed</h3>
          <span class="icon icon-green">✓</span>
        </div>
        <p class="stat-value">{{ stats.completedOrders }}</p>
        <p class="stat-sub">Successfully picked up</p>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="panel">
        <div class="panel-head">
          <h2>Today's Pickups</h2>
          <button class="calendar-btn" type="button" @click="goToCalendarTab">View Calendar</button>
        </div>

        <div v-if="loading" class="panel-empty">Loading pickups...</div>
        <div v-else-if="todaysPickups.length === 0" class="panel-empty">No pickups today</div>
        <div v-else class="pickup-list">
          <div v-for="pickup in todaysPickups" :key="pickup.id" class="pickup-item">
            <div class="pickup-left">
              <p class="pickup-name">{{ pickup.customerName }}</p>
              <p class="pickup-time">{{ pickup.timeLabel }}</p>
            </div>
            <p class="pickup-amount">{{ formatCurrency(pickup.amount) }}</p>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <h2>Recent Reviews</h2>
        </div>

        <div v-if="reviews.length === 0" class="panel-empty">No reviews yet</div>
        <div v-else class="review-list">
          <div v-for="review in reviews" :key="review.id" class="review-item">
            <div class="review-top">
              <p class="review-name">{{ review.customerName }}</p>
              <p class="review-rating">⭐ {{ review.rating }}/5</p>
            </div>
            <p class="review-comment">{{ review.comment }}</p>
          </div>
        </div>
      </article>
    </section>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>


<style scoped>
.dashboard {
  padding: 8px;
  background: transparent;
  min-height: 100%;
  color: #472715;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card,
.panel {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 20px;
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.stat-card {
  padding: 24px;
}

.stat-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-head h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #8d684e;
  font-weight: 700;
}

.icon {
  font-size: 30px;
  line-height: 1;
}

.icon-green {
  color: #0abf53;
}

.icon-blue {
  color: #3b82f6;
}

.icon-yellow {
  color: #f2b300;
}

.stat-value {
  margin: 14px 0 6px;
  font-size: 2rem;
  line-height: 1;
  font-weight: 800;
  color: #472715;
}

.stat-sub {
  margin: 0;
  color: #8d684e;
  font-size: 0.9rem;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  padding: 24px;
  min-height: 255px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.2;
  color: #3f220f;
}

.calendar-btn {
  border: none;
  background: #ecd5c4;
  color: #5d3522;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.calendar-btn:hover {
  background: #c37d5e;
}

.pickup-list,
.review-list {
  display: grid;
  gap: 12px;
}

.pickup-item,
.review-item {
  background: #fff7f0;
  border-radius: 14px;
  padding: 18px 20px;
}

.pickup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pickup-name,
.review-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.pickup-time {
  margin: 2px 0 0;
  color: #6f5545;
  font-size: 0.9rem;
}

.pickup-amount {
  margin: 0;
  color: #b85c38;
  font-weight: 700;
  font-size: 1.05rem;
}

.review-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.review-rating,
.review-comment {
  margin: 0;
  color: #6f5545;
  font-size: 0.92rem;
}

.panel-empty {
  height: 150px;
  display: grid;
  place-items: center;
  color: #6f5545;
  font-size: 0.95rem;
}

.error {
  margin-top: 12px;
  color: #d92d20;
  font-size: 14px;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>

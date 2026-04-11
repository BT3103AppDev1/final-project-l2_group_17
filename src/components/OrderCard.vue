<script setup>
import { computed } from 'vue'
import OrderStatusBadge from './OrderStatusBadge.vue'

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const createdLabel = computed(() => {
  if (!props.order.createdAt) return 'Pending timestamp'

  const date =
    typeof props.order.createdAt.toDate === 'function'
      ? props.order.createdAt.toDate()
      : new Date(props.order.createdAt)

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})

const scheduledLabel = computed(() => {
  if (!props.order.scheduledTime) return 'Pickup time not set'

  const date = new Date(props.order.scheduledTime)

  if (Number.isNaN(date.getTime())) return 'Pickup time not set'

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
})

const totalLabel = computed(() => {
  const total =
    props.order.totalPrice ??
    props.order.total ??
    props.order.items?.reduce((sum, item) => {
      const itemTotal = Number(item.subtotal ?? Number(item.price) * Number(item.quantity))
      return sum + (Number.isNaN(itemTotal) ? 0 : itemTotal)
    }, 0)

  return Number(total || 0).toFixed(2)
})
</script>

<template>
  <article class="order-card" :class="{ compact }">
    <div class="top-row">
      <div>
        <p class="order-id">{{ order.orderId }}</p>
        <p class="customer">{{ order.customerName }} · {{ order.customerEmail }}</p>
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>

    <p class="meta">
      Placed {{ createdLabel }} · {{ order.items.length }} items · ${{ totalLabel }}
    </p>

    <p class="meta">Pickup: {{ scheduledLabel }}</p>

    <ul class="items">
      <li v-for="item in order.items" :key="`${order.id}-${item.menuItemId}`">
        {{ item.quantity }} x {{ item.name }}
      </li>
    </ul>

    <p v-if="order.notes" class="note">Customer note: {{ order.notes }}</p>
  </article>
</template>

<style scoped>
.order-card {
  padding: 18px;
  border-radius: 22px;
  background: #ffffff;
  border: 1px solid rgba(91, 57, 36, 0.1);
}

.order-card.compact {
  padding: 0;
  background: transparent;
  border: none;
}

.top-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.order-id,
.customer,
.meta,
.note,
.items {
  margin: 0;
}

.order-id {
  font-weight: 800;
  color: #412210;
}

.customer,
.meta,
.note,
.items {
  color: #6a5448;
}

.customer {
  margin-top: 4px;
}

.meta {
  margin-top: 12px;
}

.items {
  padding-left: 18px;
  margin-top: 12px;
}

.note {
  margin-top: 12px;
  font-style: italic;
}

@media (max-width: 720px) {
  .top-row {
    flex-direction: column;
  }
}
</style>

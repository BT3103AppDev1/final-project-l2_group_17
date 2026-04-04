<script setup>
const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

const toneByStatus = {
  pending: 'pending',
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready_for_pickup: 'ready',
  completed: 'completed',
  cancelled: 'cancelled',
}

const labelByStatus = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
</script>

<template>
  <span class="badge" :class="toneByStatus[props.status] || 'pending'">
    {{ labelByStatus[props.status] || props.status }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: capitalize;
}

.pending {
  background: #f1dfb6;
  color: #6f4600;
}

.preparing {
  background: #f5cfa7;
  color: #8c420e;
}

.confirmed {
  background: #e4d7f8;
  color: #5d2d8f;
}

.ready {
  background: #d4eccf;
  color: #225e2e;
}

.completed {
  background: #d2e3fb;
  color: #1f4b87;
}

.cancelled {
  background: #f5cccc;
  color: #8c1d1d;
}
</style>

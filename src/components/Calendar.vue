<template>
	<section class="pickup-calendar">
		<h3 class="calendar-page-title">Pickup Calendar</h3>

		<div class="calendar-layout">
			<article class="calendar-card">
				<header class="calendar-header">
					<h2>{{ monthLabel }}</h2>
					<div class="month-controls">
						<button type="button" aria-label="Previous month" @click="goToPreviousMonth">
							&#8249;
						</button>
						<button type="button" aria-label="Next month" @click="goToNextMonth">
							&#8250;
						</button>
					</div>
				</header>

				<div class="weekday-row">
					<span v-for="day in weekDays" :key="day">{{ day }}</span>
				</div>

				<div class="month-grid">
					<div
						v-for="(cell, index) in calendarCells"
						:key="cell.key || `blank-${index}`"
						class="calendar-cell"
						:class="{
							blank: !cell.date,
							today: cell.isToday,
							selected: cell.isSelected,
							'has-orders': cell.orderCount > 0,
						}"
						@click="cell.date && selectDate(cell.date)"
					>
						<span v-if="cell.date" class="day-number">{{ cell.day }}</span>
						<span v-if="cell.orderCount > 0" class="order-count">{{ cell.orderCount }}</span>
					</div>
				</div>

				<footer class="calendar-legend">
					<span class="legend-item">
						<i class="legend-box today-box"></i>
						Today
					</span>
					<span class="legend-item">
						<i class="legend-box selected-box"></i>
						Selected
					</span>
					<span class="legend-item">
						<i class="legend-dot"></i>
						# Orders
					</span>
				</footer>
			</article>

			<aside class="details-card">
				<h3>{{ selectedDateLabel }}</h3>
				<p class="details-summary">{{ selectedOrders.length }} order(s)</p>

				<p v-if="loading" class="empty-state">Loading orders...</p>
				<p v-else-if="errorMessage" class="empty-state error">{{ errorMessage }}</p>
				<p v-else-if="!selectedOrders.length" class="empty-state">No pickups scheduled for this day</p>

				<ul v-else class="order-list">
					<li v-for="order in selectedOrders" :key="order.id" class="order-entry">
						<div class="order-head">
							<div>
								<p class="order-id">{{ order.orderId || order.id }}</p>
								<p class="order-customer">{{ order.customerName || 'Unknown customer' }}</p>
							</div>
							<OrderStatusBadge :status="order.status || 'pending'" />
						</div>

						<p class="order-meta">🕔 {{ formatOrderTime(order.scheduledTime) }}</p>

						<ul class="order-items">
							<li v-for="item in order.items || []" :key="`${order.id}-${item.menuItemId || item.name}`">
								{{ item.name }} x{{ item.quantity }}
							</li>
						</ul>

						<p class="order-total">${{ formatOrderTotal(order) }}</p>
					</li>
				</ul>
			</aside>
		</div>
	</section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import { subscribeToAllOrders } from '@/services/orderService'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const today = new Date()
const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

const visibleMonth = ref(new Date(todayAtMidnight.getFullYear(), todayAtMidnight.getMonth(), 1))
const selectedDate = ref(new Date(todayAtMidnight))
const orders = ref([])
const loading = ref(false)
const errorMessage = ref('')
let unsubscribeOrders = null

const monthLabel = computed(() => {
	return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth.value)
})

const selectedDateKey = computed(() => formatDateKey(selectedDate.value))

const selectedDateLabel = computed(() => {
	return new Intl.DateTimeFormat('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	}).format(selectedDate.value)
})

const ordersByDate = computed(() => {
	return orders.value.reduce((grouped, order) => {
		const scheduledDate = toDate(order.scheduledTime)

		if (!scheduledDate) {
			return grouped
		}

		const key = formatDateKey(scheduledDate)

		if (!grouped[key]) {
			grouped[key] = []
		}

		grouped[key].push(order)
		return grouped
	}, {})
})

const selectedOrders = computed(() => {
	const list = ordersByDate.value[selectedDateKey.value] || []

	return [...list].sort((left, right) => {
		const leftTime = toDate(left.scheduledTime)?.getTime() || 0
		const rightTime = toDate(right.scheduledTime)?.getTime() || 0
		return leftTime - rightTime
	})
})

const calendarCells = computed(() => {
	const year = visibleMonth.value.getFullYear()
	const month = visibleMonth.value.getMonth()

	const firstDayOfMonth = new Date(year, month, 1)
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const leadingBlanks = firstDayOfMonth.getDay()

	const cells = []

	for (let i = 0; i < leadingBlanks; i += 1) {
		cells.push({ key: `blank-${i}` })
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		const date = new Date(year, month, day)
		const key = formatDateKey(date)
		const orderCount = (ordersByDate.value[key] || []).length

		cells.push({
			key,
			date,
			day,
			orderCount,
			isToday: isSameDate(date, todayAtMidnight),
			isSelected: isSameDate(date, selectedDate.value),
		})
	}

	return cells
})

function goToPreviousMonth() {
	visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() - 1, 1)
}

function goToNextMonth() {
	visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1)
}

function selectDate(date) {
	selectedDate.value = new Date(date)
}

function loadOrders() {
	loading.value = true
	errorMessage.value = ''

	unsubscribeOrders = subscribeToAllOrders(
		(nextOrders) => {
			orders.value = nextOrders
			loading.value = false
		},
		(error) => {
			errorMessage.value = error.message || 'Failed to load orders.'
			loading.value = false
		},
	)
}

function formatDateKey(date) {
	const yyyy = date.getFullYear()
	const mm = String(date.getMonth() + 1).padStart(2, '0')
	const dd = String(date.getDate()).padStart(2, '0')
	return `${yyyy}-${mm}-${dd}`
}

function isSameDate(a, b) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

function toDate(value) {
	if (!value) return null

	if (typeof value?.toDate === 'function') {
		const timestampDate = value.toDate()
		return Number.isNaN(timestampDate.getTime()) ? null : timestampDate
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function formatOrderTime(scheduledTime) {
	const date = toDate(scheduledTime)

	if (!date) return 'Time not set'

	return new Intl.DateTimeFormat('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	}).format(date)
}

function formatOrderTotal(order) {
	const total =
		order.totalPrice ??
		(order.items || []).reduce((sum, item) => {
			const subtotal = Number(item.subtotal ?? Number(item.price) * Number(item.quantity))
			return sum + (Number.isNaN(subtotal) ? 0 : subtotal)
		}, 0)

	return Number(total || 0).toFixed(2)
}

onMounted(() => {
	loadOrders()
})

onUnmounted(() => {
	unsubscribeOrders?.()
})
</script>

<style scoped>
.pickup-calendar {
	padding: 0.5rem 0 1rem;
}

.calendar-page-title {
	font-size: 2.25rem;
	line-height: 1.2;
	margin: 0 0 1.5rem;
}

.calendar-layout {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 330px;
	gap: 1.5rem;
	align-items: start;
}

.calendar-card,
.details-card {
	border: 1px solid #e5e7eb;
	border-radius: 16px;
	background: #fff;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.calendar-card {
	padding: 1.5rem;
}

.calendar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.25rem;
}

.calendar-header h2 {
	margin: 0;
	font-size: 2rem;
}

.month-controls {
	display: flex;
	gap: 0.5rem;
}

.month-controls button {
	border: none;
	background: transparent;
	font-size: 2rem;
	line-height: 1;
	color: #111827;
	cursor: pointer;
	padding: 0.1rem 0.4rem;
	border-radius: 8px;
}

.month-controls button:hover {
	background: #f3f4f6;
}

.weekday-row {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	margin-bottom: 0.75rem;
	color: #4b5563;
	font-weight: 500;
}

.weekday-row span {
	text-align: center;
}

.month-grid {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 0.55rem;
}

.calendar-cell {
	position: relative;
	border: 2px solid #e5e7eb;
	border-radius: 12px;
	min-height: 84px;
	padding: 0.7rem;
	cursor: pointer;
	transition: border-color 0.15s ease, background-color 0.15s ease;
}

.calendar-cell.blank {
	visibility: hidden;
	pointer-events: none;
}

.calendar-cell.today {
	border-color: #3b82f6;
	background: #eff6ff;
}

.calendar-cell.selected {
	border-color: #f97316;
	background: #fff7ed;
}

.day-number {
	font-weight: 700;
	color: #111827;
}

.order-count {
	position: absolute;
	right: 0.45rem;
	bottom: 0.45rem;
	width: 22px;
	height: 22px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 0.8rem;
	font-weight: 700;
	color: #fff;
	background: #f97316;
}

.calendar-legend {
	display: flex;
	align-items: center;
	gap: 1.25rem;
	flex-wrap: wrap;
	margin-top: 1.35rem;
	color: #4b5563;
}

.legend-item {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.legend-box {
	width: 14px;
	height: 14px;
	border-radius: 4px;
	border: 2px solid;
}

.today-box {
	border-color: #3b82f6;
	background: #eff6ff;
}

.selected-box {
	border-color: #f97316;
	background: #fff7ed;
}

.legend-dot {
	width: 18px;
	height: 18px;
	border-radius: 999px;
	background: #f97316;
	color: #fff;
	font-size: 0.7rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.legend-dot::before {
	content: '#';
	font-weight: 700;
}

.details-card {
	padding: 1.5rem;
}

.details-card h3 {
	margin: 0;
	font-size: 2rem;
}

.details-summary {
	margin: 0.35rem 0 0;
	color: #6b7280;
	font-weight: 600;
}

.order-list {
	margin: 1.25rem 0 0;
	padding: 0;
	list-style: none;
	display: grid;
	gap: 0.75rem;
	color: #111827;
}

.order-entry {
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	padding: 0.9rem;
	background: #fafafa;
}

.order-head {
	display: flex;
	justify-content: space-between;
	gap: 0.65rem;
	align-items: flex-start;
}

.order-id,
.order-customer,
.order-meta,
.order-total {
	margin: 0;
}

.order-id {
	font-weight: 800;
	font-size: 0.95rem;
}

.order-customer {
	margin-top: 0.25rem;
	font-size: 0.95rem;
}

.order-meta {
	margin-top: 0.4rem;
	color: #4b5563;
	font-size: 0.93rem;
}

.order-items {
	margin: 0.55rem 0 0;
	padding-left: 1.05rem;
	font-size: 0.95rem;
}

.order-total {
	margin-top: 0.55rem;
	font-weight: 800;
	font-size: 1.45rem;
	color: #f97316;
}

.empty-state {
	margin-top: 2rem;
	color: #6b7280;
	font-size: 1.2rem;
}

.empty-state.error {
	color: #b91c1c;
}

@media (max-width: 1080px) {
	.calendar-layout {
		grid-template-columns: 1fr;
	}

	.details-card h3,
	.calendar-header h2 {
		font-size: 1.7rem;
	}
}
</style>

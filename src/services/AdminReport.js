import { computed, ref } from 'vue'
import { subscribeToAllOrders } from './orderservice'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CURRENT_YEAR = new Date().getFullYear()
const TOP_SELLING_LIMIT = 10

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label(context) {
          const value = Number(context.parsed.y || 0)
          return ` Revenue: $${value.toFixed(2)}`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback(value) {
          return '$' + value
        },
      },
      grid: {
        color: '#f3f4f6',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}

export function useAdminReportData() {
  const orders = ref([])
  const loading = ref(false)
  const errorMessage = ref('')

  const revenueFilter = ref('year') // 'week' | 'month' | 'year' | 'custom'
  const selectedYear = ref(CURRENT_YEAR)
  const selectedMonth = ref(new Date().getMonth())
  const customStartDate = ref('')
  const customEndDate = ref('')

  let unsubscribeOrders = null

  const completedOrdersList = computed(() => orders.value.filter((order) => order.status === 'completed'))

  const totalOrders = computed(() => orders.value.length)

  const completedOrders = computed(() => completedOrdersList.value.length)

  const totalRevenue = computed(() =>
    completedOrdersList.value.reduce((sum, order) => sum + getOrderTotal(order), 0),
  )

  const averageOrderValue = computed(() => {
    if (!completedOrders.value) return 0
    return totalRevenue.value / completedOrders.value
  })

  const completedOrdersWithDate = computed(() =>
    completedOrdersList.value
      .map((order) => ({
        date: toDate(order.createdAt) || toDate(order.updatedAt) || toDate(order.scheduledTime),
        total: getOrderTotal(order),
      }))
      .filter((entry) => entry.date),
  )

  const monthlyRevenueData = computed(() => {
    if (revenueFilter.value === 'year') {
      const totals = Array(12).fill(0)
      completedOrdersWithDate.value.forEach(({ date, total }) => {
        if (date.getFullYear() === selectedYear.value) totals[date.getMonth()] += total
      })

      return buildChartData(MONTH_LABELS, totals)
    }

    if (revenueFilter.value === 'month') {
      const daysInMonth = new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate()
      const totals = Array(daysInMonth).fill(0)

      completedOrdersWithDate.value.forEach(({ date, total }) => {
        if (
          date.getFullYear() === selectedYear.value &&
          date.getMonth() === selectedMonth.value
        ) {
          totals[date.getDate() - 1] += total
        }
      })

      return buildChartData(
        Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
        totals,
      )
    }

    if (revenueFilter.value === 'week') {
      const { start, end } = getCurrentWeekRange()
      const totals = Array(7).fill(0)

      completedOrdersWithDate.value.forEach(({ date, total }) => {
        if (date >= start && date <= end) {
          const dayIndex = Math.floor((stripTime(date) - start) / 86400000)
          if (dayIndex >= 0 && dayIndex < 7) totals[dayIndex] += total
        }
      })

      return buildChartData(WEEKDAY_LABELS, totals)
    }

    // custom
    const start = parseDateInput(customStartDate.value)
    const end = parseDateInput(customEndDate.value, true)
    if (!start || !end || start > end) return buildChartData([], [])

    const keys = []
    const totalsMap = new Map()
    const cursor = new Date(start)

    while (cursor <= end) {
      const key = toDateKey(cursor)
      keys.push(key)
      totalsMap.set(key, 0)
      cursor.setDate(cursor.getDate() + 1)
    }

    completedOrdersWithDate.value.forEach(({ date, total }) => {
      if (date >= start && date <= end) {
        const key = toDateKey(date)
        totalsMap.set(key, (totalsMap.get(key) || 0) + total)
      }
    })

    return buildChartData(
      keys.map(formatDateKeyLabel),
      keys.map((key) => totalsMap.get(key) || 0),
    )
  })

  const revenueChartTitle = computed(() => {
    if (revenueFilter.value === 'year') return `Revenue (${selectedYear.value})`
    if (revenueFilter.value === 'month') return `Revenue (${MONTH_LABELS[selectedMonth.value]} ${selectedYear.value})`
    if (revenueFilter.value === 'week') return 'Revenue (Current Week)'
    return 'Revenue (Custom Range)'
  })

  const orderStatuses = computed(() => [
    { key: 'pending', name: 'Pending', count: countOrdersByStatus('pending', orders.value) },
    { key: 'confirmed', name: 'Confirmed', count: countOrdersByStatus('confirmed', orders.value) },
    { key: 'preparing', name: 'Preparing', count: countOrdersByStatus('preparing', orders.value) },
    {
      key: 'ready_for_pickup',
      name: 'Ready',
      count: countOrdersByStatus('ready_for_pickup', orders.value),
    },
    { key: 'completed', name: 'Completed', count: countOrdersByStatus('completed', orders.value) },
    { key: 'cancelled', name: 'Cancelled', count: countOrdersByStatus('cancelled', orders.value) },
  ])

  const topSellingItems = computed(() => {
    const itemMap = new Map()

    completedOrdersList.value.forEach((order) => {
      ;(order.items || []).forEach((item) => {
        const key = item.menuItemId || item.itemId || item.name
        const quantity = Number(item.quantity || 0)
        const unitPrice = Number(item.price || 0)
        const revenue = Number(item.subtotal ?? quantity * unitPrice)

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            name: item.name || 'Unnamed item',
            quantity: 0,
            revenue: 0,
            unitPrice,
          })
        }

        const aggregate = itemMap.get(key)
        aggregate.quantity += quantity
        aggregate.revenue += Number.isNaN(revenue) ? 0 : revenue
        aggregate.unitPrice = aggregate.unitPrice || unitPrice
      })
    })

    return [...itemMap.values()]
      .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
      .slice(0, TOP_SELLING_LIMIT)
  })

  function startOrdersSubscription() {
    loading.value = true
    errorMessage.value = ''

    unsubscribeOrders = subscribeToAllOrders(
      (nextOrders) => {
        orders.value = nextOrders
        loading.value = false
      },
      (error) => {
        errorMessage.value = error.message || 'Failed to load reports.'
        loading.value = false
      },
    )
  }

  function stopOrdersSubscription() {
    unsubscribeOrders?.()
    unsubscribeOrders = null
  }

  function statusBarWidth(count) {
    const counts = orderStatuses.value.map((status) => status.count)
    const maxCount = Math.max(...counts, 0)

    if (!count || !maxCount) {
      return '0%'
    }

    return `${Math.max((count / maxCount) * 100, 10)}%`
  }

  return {
    loading,
    errorMessage,
    totalOrders,
    completedOrders,
    totalRevenue,
    averageOrderValue,
    monthlyRevenueData,
    revenueChartTitle,
    revenueFilter,
    selectedYear,
    selectedMonth,
    customStartDate,
    customEndDate,
    orderStatuses,
    topSellingItems,
    statusBarWidth,
    startOrdersSubscription,
    stopOrdersSubscription,
  }
}

function getOrderTotal(order) {
  if (Number.isFinite(Number(order?.totalPrice))) {
    return Number(order.totalPrice)
  }

  return (order?.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity || 0)
    const price = Number(item.price || 0)
    const subtotal = Number(item.subtotal ?? quantity * price)
    return sum + (Number.isNaN(subtotal) ? 0 : subtotal)
  }, 0)
}

function toDate(value) {
  if (!value) return null

  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildChartData(labels, data) {
  return {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.12)',
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#f97316',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  }
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getCurrentWeekRange() {
  const now = new Date()
  const start = stripTime(now)
  const day = start.getDay()
  const diffToMonday = (day + 6) % 7
  start.setDate(start.getDate() - diffToMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

function parseDateInput(value, endOfDay = false) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function formatDateKeyLabel(key) {
  const date = new Date(`${key}T00:00:00`)
  return Number.isNaN(date.getTime()) ? key : `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`
}

function countOrdersByStatus(status, orders) {
  return orders.filter((order) => order.status === status).length
}

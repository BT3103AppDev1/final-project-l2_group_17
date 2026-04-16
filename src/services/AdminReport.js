import { computed, ref } from 'vue'
import { subscribeToAllOrders } from './orderservice'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

  const monthlyRevenueData = computed(() => ({
    labels: MONTH_LABELS,
    datasets: [
      {
        label: 'Revenue',
        data: MONTH_LABELS.map((_, monthIndex) => getMonthlyRevenue(monthIndex, completedOrdersList.value)),
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
  }))

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

function getMonthlyRevenue(monthIndex, completedOrders) {
  return completedOrders.reduce((sum, order) => {
    const date = toDate(order.createdAt) || toDate(order.updatedAt) || toDate(order.scheduledTime)

    if (!date || date.getFullYear() !== CURRENT_YEAR || date.getMonth() !== monthIndex) {
      return sum
    }

    return sum + getOrderTotal(order)
  }, 0)
}

function countOrdersByStatus(status, orders) {
  return orders.filter((order) => order.status === status).length
}

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const ORDERS_COLLECTION = 'orders'
const COUNTER_DOCUMENT = 'metadata/orderCounter'
const VALID_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'completed',
  'cancelled',
]
const ALLOWED_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['completed'],
  completed: [],
  cancelled: [],
}

function formatSequence(sequence) {
  return String(sequence).padStart(4, '0')
}

function formatDateSegment(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

async function getNextOrderId() {
  const counterRef = doc(db, COUNTER_DOCUMENT)

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    const today = formatDateSegment()

    if (!counterSnap.exists()) {
      transaction.set(counterRef, { date: today, sequence: 1 })
      return `ORD-${today}-0001`
    }

    const data = counterSnap.data()
    const nextSequence = data.date === today ? Number(data.sequence || 0) + 1 : 1

    transaction.set(counterRef, { date: today, sequence: nextSequence })

    return `ORD-${today}-${formatSequence(nextSequence)}`
  })
}

function normalizeItems(items = []) {
  return items
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => {
      const menuItemId = item.menuItemId || item.itemId

      if (!menuItemId) {
        throw new Error('Each order item must include menuItemId or itemId.')
      }

      if (!item.name) {
        throw new Error('Each order item must include a name.')
      }

      if (Number.isNaN(Number(item.price))) {
        throw new Error('Each order item must include a valid price.')
      }

      return {
        menuItemId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        subtotal: Number(item.price) * Number(item.quantity),
      }
    })
}

function normalizeCustomerEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function normalizeCustomerName(name) {
  return String(name || '').trim()
}

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || '').trim()
}

function normalizeScheduledTime(scheduledTime) {
  if (!scheduledTime) return null

  const parsed = new Date(scheduledTime)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('scheduledTime must be a valid date/time value.')
  }

  return parsed.toISOString()
}

function validateCreateOrderPayload(payload) {
  if (!normalizeCustomerName(payload.customerName)) {
    throw new Error('customerName is required.')
  }

  if (!normalizeCustomerEmail(payload.customerEmail)) {
    throw new Error('customerEmail is required.')
  }

  if (!payload.items || !Array.isArray(payload.items)) {
    throw new Error('items must be an array.')
  }
}

function buildOrderRecord(payload, orderId) {
  const items = normalizeItems(payload.items)

  if (!items.length) {
    throw new Error('At least one cart item is required.')
  }

  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)
  const customerEmail = normalizeCustomerEmail(payload.customerEmail)
  const customerName = normalizeCustomerName(payload.customerName)
  const phoneNumber = normalizePhoneNumber(payload.phoneNumber)
  const scheduledTime = normalizeScheduledTime(payload.scheduledTime)
  const nowIso = new Date().toISOString()

  return {
    orderId,
    userId: payload.userId || null,
    storeId: payload.storeId || 'main-store',
    orderType: payload.orderType || 'pickup',
    customerName,
    customerEmail,
    phoneNumber,
    items,
    totalPrice,
    status: 'pending',
    paymentStatus: payload.paymentStatus || 'pending',
    paymentMethod: payload.paymentMethod || null,
    transactionToken: payload.transactionToken || null,
    scheduledTime,
    notes: String(payload.notes || '').trim(),
    adminNote: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusHistory: [
      {
        status: 'pending',
        updatedAt: nowIso,
        updatedBy: payload.userId || 'customer',
      },
    ],
  }
}

export async function createOrder(payload) {
  validateCreateOrderPayload(payload)
  const orderId = await getNextOrderId()
  const order = buildOrderRecord(payload, orderId)
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order)

  return {
    id: docRef.id,
    orderId,
    status: 'pending',
    totalPrice: order.totalPrice,
    customerEmail: order.customerEmail,
    scheduledTime: order.scheduledTime,
  }
}

export async function getOrderByDocumentId(orderDocId) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderDocId)
  const orderSnap = await getDoc(orderRef)

  if (!orderSnap.exists()) {
    throw new Error('Order not found.')
  }

  return {
    id: orderSnap.id,
    ...orderSnap.data(),
  }
}

export function subscribeToOrdersByEmail(email, onData, onError) {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), where('customerEmail', '==', email))

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      onData(
        snapshot.docs
          .map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          }))
          .sort((left, right) => {
            const leftTime = left.createdAt?.seconds || 0
            const rightTime = right.createdAt?.seconds || 0
            return rightTime - leftTime
          }),
      )
    },
    onError,
  )
}

export function subscribeToOrdersByUserId(userId, onData, onError) {
  if (!userId) {
    throw new Error('userId is required to subscribe to customer orders.')
  }

  const ordersQuery = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId))

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      onData(
        snapshot.docs
          .map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data(),
          }))
          .sort((left, right) => {
            const leftTime = left.createdAt?.seconds || 0
            const rightTime = right.createdAt?.seconds || 0
            return rightTime - leftTime
          }),
      )
    },
    onError,
  )
}

export function subscribeToAllOrders(onData, onError) {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      onData(
        snapshot.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data(),
        })),
      )
    },
    onError,
  )
}

export async function updateOrderStatus(orderDocId, nextStatus, updatedBy = 'admin') {
  if (!VALID_STATUSES.includes(nextStatus)) {
    throw new Error(`Invalid status: ${nextStatus}`)
  }

  const orderRef = doc(db, ORDERS_COLLECTION, orderDocId)

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef)

    if (!orderSnap.exists()) {
      throw new Error('Order not found.')
    }

    const currentOrder = orderSnap.data()
    const currentStatus = currentOrder.status

    if (currentStatus === nextStatus) {
      return
    }

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
      throw new Error(`Cannot change status from ${currentStatus} to ${nextStatus}.`)
    }

    const history = Array.isArray(currentOrder.statusHistory) ? currentOrder.statusHistory : []

    transaction.update(orderRef, {
      status: nextStatus,
      updatedAt: serverTimestamp(),
      statusHistory: [
        ...history,
        {
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          updatedBy,
        },
      ],
    })
  })
}

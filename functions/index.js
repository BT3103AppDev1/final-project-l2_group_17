const admin = require('firebase-admin')
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { logger } = require('firebase-functions')
const { defineSecret } = require('firebase-functions/params')
const nodemailer = require('nodemailer')

admin.initializeApp()

const ORDERS_COLLECTION = 'orders'
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD')
const SMTP_USER = 'btmorelikegpt@gmail.com'
const DEFAULT_FROM = 'HomeKitchen <btmorelikegpt@gmail.com>'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: GMAIL_APP_PASSWORD.value(),
    },
  })
}

function formatCurrency(amount) {
  const numericAmount = Number(amount || 0)
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(numericAmount)
}

function formatStatusLabel(status) {
  return String(status || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatScheduledTime(scheduledTime) {
  if (!scheduledTime) {
    return 'Not specified'
  }

  const date = new Date(scheduledTime)

  if (Number.isNaN(date.getTime())) {
    return String(scheduledTime)
  }

  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function renderOrderItems(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '<li>No items recorded.</li>'
  }

  return items
    .map(
      (item) =>
        `<li>${item.quantity} x ${item.name} (${formatCurrency(item.subtotal || item.price)})</li>`,
    )
    .join('')
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    logger.warn('Skipping email because recipient was missing.', { subject })
    return
  }

  const transporter = getTransporter()

  await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  })
}

function buildOrderPlacedEmail(order) {
  const scheduledTime = formatScheduledTime(order.scheduledTime)
  const itemsHtml = renderOrderItems(order.items)
  const orderId = order.orderId || 'Pending order ID'

  return {
    subject: `Order ${orderId} received`,
    text: [
      `Hi ${order.customerName || 'customer'},`,
      '',
      `We received your order ${orderId}.`,
      `Current status: ${formatStatusLabel(order.status)}`,
      `Pickup time: ${scheduledTime}`,
      `Total: ${formatCurrency(order.totalPrice)}`,
      '',
      'We will email you again when the order status changes.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933;">
        <h2 style="color: #b85c38;">Order received</h2>
        <p>Hi ${order.customerName || 'customer'},</p>
        <p>We received your order <strong>${orderId}</strong>.</p>
        <p><strong>Status:</strong> ${formatStatusLabel(order.status)}</p>
        <p><strong>Pickup time:</strong> ${scheduledTime}</p>
        <p><strong>Total:</strong> ${formatCurrency(order.totalPrice)}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemsHtml}</ul>
        ${
          order.notes
            ? `<p><strong>Special instructions:</strong> ${order.notes}</p>`
            : ''
        }
        <p>We will email you again when the order status changes.</p>
      </div>
    `,
  }
}

function buildStatusChangedEmail(order, previousStatus) {
  const orderId = order.orderId || 'Pending order ID'
  const nextStatus = formatStatusLabel(order.status)
  const previous = formatStatusLabel(previousStatus)
  const scheduledTime = formatScheduledTime(order.scheduledTime)

  return {
    subject: `Order ${orderId} is now ${nextStatus}`,
    text: [
      `Hi ${order.customerName || 'customer'},`,
      '',
      `Your order ${orderId} changed from ${previous} to ${nextStatus}.`,
      `Pickup time: ${scheduledTime}`,
      `Total: ${formatCurrency(order.totalPrice)}`,
      '',
      'Thank you for ordering with us.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2933;">
        <h2 style="color: #b85c38;">Order status updated</h2>
        <p>Hi ${order.customerName || 'customer'},</p>
        <p>
          Your order <strong>${orderId}</strong> changed from
          <strong>${previous}</strong> to <strong>${nextStatus}</strong>.
        </p>
        <p><strong>Pickup time:</strong> ${scheduledTime}</p>
        <p><strong>Total:</strong> ${formatCurrency(order.totalPrice)}</p>
        <p>Thank you for ordering with us.</p>
      </div>
    `,
  }
}

exports.onOrderCreatedSendEmail = onDocumentCreated(
  {
    document: `${ORDERS_COLLECTION}/{orderDocId}`,
    region: 'us-central1',
    secrets: [GMAIL_APP_PASSWORD],
  },
  async (event) => {
    const order = event.data?.data()

    if (!order) {
      logger.warn('Order create trigger fired without order data.', {
        orderDocId: event.params.orderDocId,
      })
      return
    }

    const email = buildOrderPlacedEmail(order)

    await sendEmail({
      to: order.customerEmail,
      ...email,
    })
  },
)

exports.onOrderStatusChangedSendEmail = onDocumentUpdated(
  {
    document: `${ORDERS_COLLECTION}/{orderDocId}`,
    region: 'us-central1',
    secrets: [GMAIL_APP_PASSWORD],
  },
  async (event) => {
    const before = event.data?.before?.data()
    const after = event.data?.after?.data()

    if (!before || !after) {
      logger.warn('Order update trigger fired without both before and after data.', {
        orderDocId: event.params.orderDocId,
      })
      return
    }

    if (before.status === after.status) {
      return
    }

    const email = buildStatusChangedEmail(after, before.status)

    await sendEmail({
      to: after.customerEmail,
      ...email,
    })
  },
)

<template>
  <div v-if="!isEmailVerified && !isLoading" class="warning-banner">
    <p>
      You won't be able to perform any actions as your email is not verified. Please check your inbox.<br>
      Alternatively, please click on the <b>Resend Verification Email</b> button to receive a new verification email.
    </p>
    <button @click="sendVerificationEmail" class="btn-verify" :disabled="isSending">
      {{ isSending ? 'Sending...' : 'Resend Verification Email' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth'

const emit = defineEmits(['verified'])

const isEmailVerified = ref(false)
const isLoading = ref(true)
const isSending = ref(false)
let verificationPoller = null

onMounted(() => {
  const user = auth.currentUser
  if (user) {
    isEmailVerified.value = user.emailVerified
    if (!user.emailVerified) {
      startVerificationPolling()
    }
  }
  isLoading.value = false
})

onUnmounted(() => {
  stopVerificationPolling()
})

function startVerificationPolling() {
  if (verificationPoller) return

  verificationPoller = setInterval(async () => {
    const user = auth.currentUser
    if (!user) return

    await user.reload()  // force Firebase to re-fetch latest user data

    if (user.emailVerified) {
      stopVerificationPolling()
      isEmailVerified.value = true
      emit('verified')
    }
  }, 5000)
}

function stopVerificationPolling() {
  if (verificationPoller) {
    clearInterval(verificationPoller)
    verificationPoller = null
  }
}

async function sendVerificationEmail() {
  try {
    isSending.value = true
    const user = auth.currentUser
    if (!user) return
    await sendEmailVerification(user)
    alert('Verification email sent! Please check your inbox.')
  } catch (error) {
    if (error.code === 'auth/too-many-requests') {
      alert('Too many requests. Please try again later.')
    } else {
      alert('Failed to send verification email.')
    }
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.warning-banner {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.warning-banner p {
  margin: 0;
  color: #856404;
  font-weight: 500;
  flex: 1;
}

.btn-verify {
  padding: 8px 16px;
  background: #ffc107;
  border: none;
  border-radius: 6px;
  color: #856404;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.3s;
}

.btn-verify:hover:not(:disabled) { background: #e0a800; }
.btn-verify:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
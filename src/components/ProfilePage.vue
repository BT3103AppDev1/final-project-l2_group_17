<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- Header Section -->
      <h1 class="profile-title">My Profile</h1>
      
      <!-- Email Verification Warning (if not verified) -->
      <div v-if="!isEmailVerified && !isLoading" class="warning-banner">
        <p>Your email is not verified. Please check your inbox.</p>
        <button @click="sendVerificationEmail" class="btn-verify" :disabled="isSendingVerification">
          {{ isSendingVerification ? 'Sending...' : 'Resend Verification Email' }}
        </button>
      </div>
      
      <!-- Display Message (success or error) -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>

      <!-- Loading - Shows while fetching data -->
      <div v-if="isLoading" class="profile-form">
        <div class="form-group" v-for="n in 3" :key="n">
          <div class="skeleton-label"></div>
          <div class="skeleton-field"></div>
        </div>
        <div class="skeleton-button"></div>
      </div>

      <!-- Actual profile- Shows after data loads -->
      <div v-else class="profile-form">
        
        <!-- Name Field -->
        <div class="form-group">
          <label>Name</label>
          <input 
            v-if="isEditing"
            v-model="editableProfile.name"
            type="text"
            class="form-input"
            placeholder="Enter your name"
          />
          <p v-else class="form-display">{{ profile.name }}</p>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label>Email</label>
          <div class="email-field">
            <p class="form-display">{{ profile.email }}</p>
            <span v-if="isEmailVerified" class="verified-badge">✓ Verified</span>
            <span v-else class="unverified-badge">✗ Not Verified</span>
          </div>
          <button 
            v-if="!isChangingEmail"
            @click="isChangingEmail = true" 
            class="btn btn-primary" 
            style="margin-top: 8px; width: fit-content; padding: 8px 16px; font-size: 0.9rem"
          >
            Change Email
          </button>
          <!-- Change Email Form (shown when isChangingEmail is true) -->
          <div v-if="isChangingEmail" class="change-form">
            <input 
              v-model="newEmail" 
              type="email" 
              class="form-input" 
              placeholder="Enter new email address" 
            />
            <input 
              v-model="emailPassword" 
              type="password" 
              class="form-input" 
              placeholder="Enter your current password to confirm" 
            />
            <div class="button-group">
              <button @click="changeEmail" class="btn btn-success" :disabled="isSavingEmail">
                {{ isSavingEmail ? 'Sending...' : 'Send Verification' }}
              </button>
              <button @click="isChangingEmail = false" class="btn btn-secondary" :disabled="isSavingEmail">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Member Since (Customer only) -->
        <div class="form-group" v-if="profile.role === 'customer'">
          <label>Member Since</label>
          <p class="form-display">{{ formatDate(profile.createdAt) }}</p>
        </div>

        <!-- Role Field  -->
        <div class="form-group" >
          <label>Role</label>
          <p class="form-display role-badge">{{ profile.role }}</p>
        </div>

        <!-- Change Password Section -->
        <div class="form-group">
          <label>Password</label>
          
          <button 
            v-if="!isChangingPassword"
            @click="isChangingPassword = true" 
            class="btn btn-primary" 
            style="width: fit-content; padding: 8px 16px; font-size: 0.9rem"
          >
            Change Password
          </button>

          <!-- Change Password Form -->
          <div v-if="isChangingPassword" class="change-form">
            <input 
              v-model="currentPassword" 
              type="password" 
              class="form-input" 
              placeholder="Current password" 
            />
            <input 
              v-model="newPassword" 
              type="password" 
              class="form-input" 
              placeholder="New password (min. 6 characters)" 
            />
            <input 
              v-model="confirmPassword" 
              type="password" 
              class="form-input" 
              placeholder="Confirm new password" 
            />
            <div class="button-group">
              <button @click="changePassword" class="btn btn-success" :disabled="isSavingPassword">
                {{ isSavingPassword ? 'Saving...' : 'Update Password' }}
              </button>
              <button @click="isChangingPassword = false" class="btn btn-secondary" :disabled="isSavingPassword">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="button-group">
          <span v-if="!isEditing" :title="!isEmailVerified ? profileEditTooltip : ''">
            <button 
              @click="startEditing"
              class="btn btn-primary"
              :disabled="!isEmailVerified"
            >
              Edit Profile
            </button>
          </span>

          <template v-else>
            <span :title="!isEmailVerified ? profileEditTooltip : ''">
              <button 
                @click="saveProfile"
                class="btn btn-success"
                :disabled="isSaving || !isEmailVerified"
              >
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </span>
            <button 
              @click="cancelEditing"
              class="btn btn-secondary"
              :disabled="isSaving"
            >
              Cancel
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { 
  onAuthStateChanged, 
  sendEmailVerification, 
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from 'firebase/auth'
import { VERIFICATION_MESSAGES } from '@/services/verificationService'
import { useRouter } from 'vue-router'

const router = useRouter()

const profile = ref({
  name: '',
  email: '',
  phone: '',
  role: '',
  createdAt: null,
  uid: ''
})

const editableProfile = ref({
  name: '',
  phone: ''
})

const isEditing = ref(false)
const isSaving = ref(false)
const isLoading = ref(true)  // Track loading state
const isEmailVerified = ref(false)  // Track email verification
const isSendingVerification = ref(false)  // Track verification email sending

const message = ref('')
const messageType = ref('')
const profileEditTooltip = ref(VERIFICATION_MESSAGES.profileEdit)

// --- Email Change State ---
const isChangingEmail = ref(false)       // toggles the email change form
const newEmail = ref('')                  // stores what user types
const emailPassword = ref('')             // current password for reauth
const isSavingEmail = ref(false)          // disables button while saving

// --- Password Change State ---
const isChangingPassword = ref(false)    // toggles the password change form
const currentPassword = ref('')           // user's current password
const newPassword = ref('')               // new password they want
const confirmPassword = ref('')           // must match newPassword
const isSavingPassword = ref(false)       // disables button while saving

// --- Email verification polling ---
let verificationPoller = null

async function changeEmail() {
  // --- Basic validation ---
  if (!newEmail.value) {
    showMessage('Please enter a new email address.', 'error')
    return
  }
  if (!emailPassword.value) {
    showMessage('Please enter your current password to confirm.', 'error')
    return
  }

  try {
    isSavingEmail.value = true
    const user = auth.currentUser

    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, emailPassword.value)
    await reauthenticateWithCredential(user, credential)

    // Send verification to new email
    await verifyBeforeUpdateEmail(user, newEmail.value)

    showMessage(
      `Verification email sent to ${newEmail.value}. 
       Your email will update once you verify it. 
       You will be logged out now.`, 
      'success'
    )

    // Log out after 3s
    setTimeout(async () => {
      await signOut(auth)
      router.push('/')
    }, 3000)

  } catch (error) {
    console.error('Error changing email:', error)
    if (error.code === 'auth/wrong-password') {
      showMessage('Incorrect password. Please try again.', 'error')
    } else if (error.code === 'auth/email-already-in-use') {
      showMessage('This email is already in use by another account.', 'error')
    } else if (error.code === 'auth/invalid-email') {
      showMessage('Please enter a valid email address.', 'error')
    } else {
      showMessage('Failed to change email. Please try again.', 'error')
    }
  } finally {
    isSavingEmail.value = false
  }
}

async function changePassword() {
  // --- Validation ---
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    showMessage('Please fill in all password fields.', 'error')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showMessage('New passwords do not match.', 'error')
    return
  }
  if (newPassword.value.length < 6) {
    showMessage('New password must be at least 6 characters.', 'error')
    return
  }

  try {
    isSavingPassword.value = true
    const user = auth.currentUser

    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value)
    await reauthenticateWithCredential(user, credential)

    // Update to new password
    await updatePassword(user, newPassword.value)

    showMessage('Password changed successfully! Logging you out...', 'success')

    // Log out after 3 seconds
    setTimeout(async () => {
      await signOut(auth)
      router.push('/')
    }, 3000)

  } catch (error) {
    console.error('Error changing password:', error)

    if (error.code === 'auth/wrong-password') {
      showMessage('Current password is incorrect.', 'error')
    } else if (error.code === 'auth/weak-password') {
      showMessage('New password is too weak. Use at least 6 characters.', 'error')
    } else {
      showMessage('Failed to change password. Please try again.', 'error')
    }
  } finally {
    isSavingPassword.value = false
  }
}

async function loadProfile() {
  try {
    isLoading.value = true
    const user = auth.currentUser
    
    if (!user) {
      showMessage('No user logged in', 'error')
      return
    }

    // Check email verification status
    isEmailVerified.value = user.emailVerified

    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      
      profile.value = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || '',
        createdAt: data.createdAt,
        uid: user.uid
      }
    } else {
      showMessage('Profile not found', 'error')
    }

    if (!user.emailVerified) {
      startVerificationPolling()
    }

  } catch (error) {
    console.error('Error loading profile:', error)
    showMessage('Failed to load profile', 'error')
  } finally {
    isLoading.value = false
  }
}

function startVerificationPolling() {
  if (verificationPoller) return

  verificationPoller = setInterval(async () => {
    const user = auth.currentUser
    if (!user) return

    // Force Firebase to reload the user's data from the server
    await user.reload()

    if (user.emailVerified) {
      isEmailVerified.value = true   // update the badge on screen
      stopVerificationPolling()
      showMessage('Email verified successfully!', 'success')
    }
  }, 5000) // check every 5 seconds
}

function stopVerificationPolling() {
  if (verificationPoller) {
    clearInterval(verificationPoller)  // stops the repeated checking
    verificationPoller = null
  }
}

async function sendVerificationEmail() {
  try {
    isSendingVerification.value = true
    const user = auth.currentUser
    
    if (!user) {
      showMessage('No user logged in', 'error')
      return
    }

    await sendEmailVerification(user)
    showMessage('Verification email sent! Please check your inbox.', 'success')
  } catch (error) {
    console.error('Error sending verification email:', error)
    
    if (error.code === 'auth/too-many-requests') {
      showMessage('Too many requests. Please try again later.', 'error')
    } else {
      showMessage('Failed to send verification email', 'error')
    }
  } finally {
    isSendingVerification.value = false
  }
}

function startEditing() {
  if (!isEmailVerified.value) {
    return
  }
  isEditing.value = true
  editableProfile.value = {
    name: profile.value.name,
    phone: profile.value.phone
  }
}

function cancelEditing() {
  isEditing.value = false
}

async function saveProfile() {
  if (isSaving.value || !isEmailVerified.value) return
  
  try {
    isSaving.value = true
    
    const user = auth.currentUser
    if (!user) {
      showMessage('No user logged in', 'error')
      return
    }

    await updateDoc(doc(db, 'users', user.uid), {
      name: editableProfile.value.name,
      phone: editableProfile.value.phone,
      updatedAt: new Date()
    })

    profile.value.name = editableProfile.value.name
    profile.value.phone = editableProfile.value.phone

    isEditing.value = false
    showMessage('Profile updated successfully!', 'success')
    
  } catch (error) {
    console.error('Error saving profile:', error)
    showMessage('Failed to save changes', 'error')
  } finally {
    isSaving.value = false
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-UK', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function showMessage(text, type = 'success') {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadProfile()
    } else {
      isLoading.value = false
    }
  })
})

onUnmounted(() => {
  stopVerificationPolling()
})
</script>

<style scoped>
.profile-container {
  min-height: auto;
  background: transparent;
  padding: 2%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 24px;
  padding: 28px;
  max-width: 700px;
  width: 100%;
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.profile-title {
  font-size: 1.6rem;
  color: #3f220f;
  margin-bottom: 24px;
  text-align: left;
}

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

.btn-verify:hover:not(:disabled) {
  background: #e0a800;
}

.btn-verify:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.skeleton-label {
  width: 80px;
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-field {
  width: 100%;
  height: 48px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

.skeleton-button {
  width: 100%;
  height: 48px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  margin-top: 10px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #8d684e;
  font-size: 0.95rem;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #b85c38;
}

.form-display {
  padding: 12px 16px;
  background: #f8f8f8;
  border-radius: 8px;
  color: #333;
  font-size: 1rem;
}

.email-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.email-field .form-display {
  flex: 1;
  margin: 0;
}

.verified-badge {
  padding: 4px 12px;
  background: #d4edda;
  color: #155724;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.unverified-badge {
  padding: 4px 12px;
  background: #f8d7da;
  color: var(--delete-color);
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.role-badge {
  display: inline-block;
  background: var(--col-main);
  color: #fff8ef;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.9rem;
  width: fit-content;
}

.field-note {
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--col-main);
  color: #fff8ef;
}

.btn-primary:hover:not(:disabled) {
  background: var(--col-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(184, 92, 56, 0.3);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.change-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
}
</style>

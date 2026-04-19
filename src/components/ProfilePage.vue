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
          <span class="field-note">Email cannot be changed</span>
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

        <!-- Action Buttons -->
        <div class="button-group">
          <button 
            v-if="!isEditing"
            @click="startEditing"
            class="btn btn-primary"
          >
            Edit Profile
          </button>

          <template v-else>
            <button 
              @click="saveProfile"
              class="btn btn-success"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
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
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth'

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
  } catch (error) {
    console.error('Error loading profile:', error)
    showMessage('Failed to load profile', 'error')
  } finally {
    isLoading.value = false
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
  if (isSaving.value) return
  
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
</style>
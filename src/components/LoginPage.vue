<template>
  <div class="page-container">
    <nav class="banner">
      <span class="nav-brand">🍽️ Home Kitchen</span>
    </nav>
    <div class="wrapper">
      <div class="card">
        <div class="business">
          <h1 id="logo">🍽️</h1>
          <h1 id="business-title">Home Kitchen</h1>
          <p id="desc">Pre-order homemade meals</p>
        </div>

      <!-- Tab buttons to select login or registering -->
      <div class="tabs">
        <!-- Login button -->
        <button :class="['tab', { active: !isRegistering }]"
          @click="switchTab(false)"
        >
        Login
        </button>
        
        <!-- Register button -->
        <button :class="['tab', { active: isRegistering }]"
          @click="switchTab(true)"
        >
        Register
        </button>
      </div>

      <!-- Role selection: Customer or Admin -->
      <p v-if='isRegistering' class="role-label">I am a</p>
      <div v-if='isRegistering' class="role-group">
        <!-- Customer button -->
        <button :class="['role', { active: role==='customer' }]"
          @click="role='customer'"
        >
        Customer
        </button>
        
        <!-- Admin button -->
        <button :class="['role', { active: role==='admin' }]"
          @click="selectAdminRole"
        >
        Admin
        </button>
      </div>
      <!-- FirebaseUI to render the login/ register form -->
      <div id="firebaseui-auth-container"></div>
    </div>
  </div>
  </div>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>Home Kitchen</h3>
        <p>Homemade meals made with love.</p>
      </div>

      <div class="footer-section">
        <h3>Contact</h3>
        <p>Email: hello@homekitchen.com</p>
        <p>Phone: (555) 123-4567</p>
      </div>

      <div class="footer-section">
        <h3>Hours</h3>
        <p>Pickup: Mon-Sat</p>
        <p>10:00 AM - 7:00 PM</p>
      </div>
    </div>

    <div class="footer-bottom">
      <hr />
      <p>&copy; 2026 Home Kitchen. All rights reserved.</p>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'
import * as firebaseui from 'firebaseui'
import "firebaseui/dist/firebaseui.css"
import { EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, signOut, deleteUser, sendEmailVerification } from 'firebase/auth'
import { getDoc, setDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

// UI state
const router = useRouter()
const isRegistering = ref(false) // login tab
const role = ref("customer")
const isAdminVerified = ref(false)
let ui = null
const message = ref("")
const messageType = ref("")
const isProcessingLogin = ref(false)

function showMessage(text, type="success") {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ""
  })
}

// Start or restart the FirebaseUI widget
async function startUI() {
  if (firebaseui.auth.AuthUI.getInstance()) {
    ui = firebaseui.auth.AuthUI.getInstance()
  } else {
    ui = new firebaseui.auth.AuthUI(auth)
  }

  ui.reset()

  ui.start("#firebaseui-auth-container", {
    signInOptions: [
      {
        provider: EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: isRegistering.value
      },
      {
        provider: GoogleAuthProvider.PROVIDER_ID,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
        ]
      }
    ],

    signInFlow: "popup",
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,

    callbacks: {
      signInSuccessWithAuthResult(authResult) {
        handleAfterLogin(authResult)
        return false
      },
      signInFailure(error) {
        if (error.code === 'firebaseui/anonymous-upgrade-merge-conflict') {
          return
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
          alert("This email is already registered with a different sign-in method. Please use that method to log in instead.")
          return
        }
        alert("Something went wrong: " + error.message)
      }
    }
  })
}

async function selectAdminRole() {
  const secret = prompt("Please enter the Admin Registration Code:")

  if (secret === "KiTcHeN#2026!") {
    role.value = 'admin'
    isAdminVerified.value = true
    alert("Verification successful. Please proceed with registering as an Admin!")
    startUI()
  } else {
    alert("Incorrect code. You cannot register as an Admin.")
    role.value = 'customer'
    isAdminVerified.value = false
  }
}

function generateReferral() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function generateUniqueReferral() {
  let code = ''
  let exists = true

  while (exists) {
    code = generateReferral();

    const q = query(
      collection(db, "users"),
      where("referralCode", "==", code)
    )

      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        exists = false
      }
    return code
    }
}

async function handleAfterLogin(authResult) {
  isProcessingLogin.value = true

  const isNewUser = authResult.additionalUserInfo?.isNewUser
  const user = authResult.user

  try {
    if (isNewUser && !isRegistering.value) {
      await deleteUser(user)
      alert("No account found with this email. Please register first.")
      isRegistering.value = true
      startUI()
      return
    } else if (!isNewUser && isRegistering.value) {
      await signOut(auth)
      alert("An account with this email already exists. Please log in instead.")
      isRegistering.value = false
      startUI()
      return
    } else if (isNewUser) {
      let referral = null;
      if (role.value === "customer") {
        referral = await generateReferral();
      }

      const email = user.email || user.providerData?.[0]?.email
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: email,
        role: role.value,
        points: role.value === "customer" ? 0 : null,
        createdAt: new Date(),
        referralCode: role.value === "customer" ? referral : null,
        referredBy: null
      })

      if ( providerId === 'password' && !user.emailVerified ) {
        await sendEmailVerification(user)
        alert("Account created! A verification email has been sent to " + email)
      } else {
        alert("Account created succesfully! Welcome!")
      }
      
      await redirectByRole(user)
    } else {
      const docSnap = await getDoc(doc(db, "users", user.uid))

      if (!docSnap.exists()) {
        // Auth exists but Firestore doesn't
        await deleteUser(user)
        alert("Profile data missing. Please register again.")
        isRegistering.value = true
        startUI()
        return
      }

      alert("Logged in successfully! Welcome back!")
      await redirectByRole(user)
    }
  } catch (error) {
    console.error("Login handling error: ", error)
  } finally {
    isProcessingLogin.value = false
  }

  return false
}

function switchTab(registerMode) {
  isRegistering.value = registerMode
  startUI()
}

async function redirectByRole(user) {
  const docSnap = await getDoc(doc(db, "users", user.uid))
  if (docSnap.exists()) {
    const data = docSnap.data()
    if (data.role === 'customer') {
      router.push('/customer/menu')
    } else {
      router.push('/admin/orders')
    }
  }
}

onMounted(() => {
  startUI()

  onAuthStateChanged(auth, async (user) => {
    if (isProcessingLogin.value) return

    if (user) {
      await redirectByRole(user)
    }
  })
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.wrapper{
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--col-main);
  margin: 0;
  padding: 40px 0;
}

.page-container {
  display: flex;
  flex-direction: column;
  min-height:100vh;
}

.banner {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #eee;
  font-size: clamp(1.2rem, 4vw, 2.2rem);
  font-weight: 700;
  color: var(--col-main);
}

.card {
  background: white;
  border-radius: 20px;
  padding: 32px 28px;
  width: 90%;
  max-width: 700px;
  box-shadow: 0.4px 24px, rgba(0,0,0,0.08);
  justify-items: center;
  justify-content: space-evenly;
}

.business {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

#logo {
  font-size: 4em;
  padding: 4px;
}

#business-title {
  font-size: 2.8em;
  padding: 10px;
}

#desc {
  font-size: x-large;
}

.tabs {
  display: flex;
  background: whitesmoke;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
  width: 100%;
  height: 10%;
}

.tab {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: clamp(1.2rem, 3vw, 2rem);
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #888;
}

.tab.active {
  background: white;
  color: black;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

.tab:hover {
  background: white;
}

.role-label {
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 400;
  color: black;
  margin-bottom: 10px;
}

.role-group {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  width: 80%;
  height: 10%;
}

.role {
  flex: 1;
  padding: 4px;
  border: 2px solid #ddd;
  border-collapse: collapse;
  border-radius: 10px;
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 500;
  background: white;
  color: #333;
  cursor: pointer;
}

.role.active{
  border-color: var(--col-main);
  background: rgb(253, 223, 195);
  color: var(--col-main);
}

.role:hover {
  background-color: #eee;
}

#firebaseui-auth-container :deep(.firebaseui-idp-button) {
  max-width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 15px;
}

#firebaseui-auth-container :deep(.firebaseui-idp-text) {
  font-size: 1.2rem; 
  font-weight: 600;
}

#firebaseui-auth-container :deep(.firebaseui-idp-icon) {
  width: 24px;
  height: 24px;
}

.footer {
  background-color: var(--text-main); 
  color: #ffffff;
  padding: 40px 20px 20px;
  width: 100%;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  gap: 80px;
}

.footer-section {
  flex: 1;
  min-width: 200px;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 250px;
}

.footer-section p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #cccccc;
  margin-bottom: 8px;
}

.footer-bottom {
  text-align: center;
  margin-top: 40px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.footer-bottom hr {
  border: 0;
  border-top: 1px solid #333;
}

.footer-bottom p {
  font-size: 0.85rem;
  color: #888;
}
</style>
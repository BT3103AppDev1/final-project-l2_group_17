<template>
  <div class="wrapper">
    <div class="card">
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
      <p class="role-label">I am a</p>
      <div class="role-group">
        <!-- Customer button -->
        <button :class="['role', { active: role==='customer' }]"
          @click="role='customer'"
        >
        Customer
        </button>
        
        <!-- Admin button -->
        <button :class="['role', { active: role==='admin' }]"
          @click="role='admin'"
        >
        Admin
        </button>
      </div>

      <!-- FirebaseUI to render the login/ register form -->
      <div id="firebaseui-auth-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'
import * as firebaseui from 'firebaseui'
import "firebaseui/dist/firebaseui.css"
import { EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth'
import { getDoc, setDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

// UI state
const router = useRouter()
const isRegistering = ref(false) // login tab
const role = ref("customer")
let ui = null
const message = ref("")
const messageType = ref("")

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

async function handleAfterLogin(authResult) {
  const isNewUser = authResult.additionalUserInfo?.isNewUser
  const user = authResult.user

  if (isNewUser && !isRegistering.value) {
    await signOut(auth)
    alert("No account found with this email. Please register an account first.")
    isRegistering.value = true
    startUI()
    return
  } else if (!isNewUser && isRegistering.value) {
    const docSnap = await getDoc(doc(db, "users", user.uid))
    const actualRole = docSnap.data().role
    await signOut(auth)
    alert("An account with this email already exists. Please log in instead.")
    isRegistering.value = false
    role.value = actualRole
    startUI()
    return
  } else if (isNewUser) {
    const email = user.email || user.providerData?.[0]?.email
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: email,
      role: role.value,
      createdAt: new Date()
    })
    alert("Account created succesfully! Welcome!")
    await redirectByRole(user)
  } else {
    const docSnap = await getDoc(doc(db, "users", user.uid))
    const actualRole = docSnap.data().role

    if (role.value !== actualRole) {
      await signOut(auth)
      alert("Please login under the correct role.")
      role.value = actualRole
      startUI()
      return
    }

    alert("Logged in successfully! Welcome back!")
    await redirectByRole(user)
  }
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

  let isFirstLoad = true

  onAuthStateChanged(auth, async (user) => {
    if(!isFirstLoad) return
    isFirstLoad = false

    if (user) {
      await redirectByRole(user)
    }
  })
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.wrapper{
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:#f77519;
  font-family: 'Segoe UI', sans-serif;
}

.card {
  background: white;
  border-radius: 20px;
  padding: 32px 28px;
  min-width: 700px;
  width: 40vw;
  min-height: 50vh;
  box-shadow: 0.4px 24px, rgba(0,0,0,0.08);
  justify-items: center;
  justify-content: space-evenly;
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
  font-size: 2rem;
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

.role-label {
  font-size: 2rem;
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
  padding: 0px;
  border: 2px solid #ddd;
  border-collapse: collapse;
  border-radius: 10px;
  font-size: 1.5rem;
  font-weight: 500;
  background: white;
  color: #333;
  cursor: pointer;
}

.role.active{
  border-color: #f77519;
  background: rgb(253, 223, 195);
  color: #f77519;
}
</style>
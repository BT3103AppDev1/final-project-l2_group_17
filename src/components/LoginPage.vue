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

      <!-- Role selection: Customer or Owner -->
      <p class="role-label">I am a</p>
      <div class="role-group">
        <!-- Customer button -->
        <button :class="['role', { active: role==='customer' }]"
          @click="role='customer'"
        >
        Customer
        </button>
        
        <!-- Owner button -->
        <button :class="['role', { active: role==='owner' }]"
          @click="role='owner'"
        >
        Owner
        </button>
      </div>

      <!-- FirebaseUI to render the login/ register form -->
      <div id="firebaseui-auth-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { auth } from "../firebase"
import * as firebaseui from "firebaseui"
import "firebaseui/dist/firebaseui.css"
import { EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"
import { getDoc, setDoc, doc } from "firebase/firestore"
import { db } from "../firebase" 

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
function startUI() {
  if (firebaseui.auth.AuthUI.getInstance()) {
    ui = firebaseui.auth.AuthUI.getInstance()
  } else {
    ui = new firebaseui.auth.AuthUI(auth)
  }

  ui.start("#firebaseui-auth-container", {
    signInOptions: [
      {
        provider: EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: isRegistering.value
      },
      {
        provider: GoogleAuthProvider.PROVIDER_ID
      }
    ],

    signInFlow: "popup",

    callbacks: {
      signInSuccessWithAuthResult(authResult) {
        handleAfterLogin(authResult)
        return false
      },
      signInFailure(error) {
        alert("Something went wrong: " + error.message)
      }
    }
  })
}

async function handleAfterLogin(authResult) {
  const isNewUser = authResult.additionalUserInfo?.isNewUser
  const user = authResult.user

  if (isNewUser && !isRegistering.value) {
    await user.delete()
    alert("No account found with this email. Please register an account first.")
    isRegistering.value = true
    startUI()
    return
  } else if (!isNewUser && isRegistering.value) {
    alert("An account with this email already exists. Please log in instead.")
    startUI()
    return
  } else if (isNewUser) {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: role.value,
      createdAt: new Date()
    })
    alert("Account created succesfully! Please proceed to login!")
    isRegistering = false
    startUI()
  } else {
    alert("Logged in successfully! Welcome back!")
    // Redirect based on role button
    if (role.value === 'customer') {
      router.push('/customer/menu') // CustomerMenu view
    } else if (role.value === 'owner') {
      router.push('/owner/dashboard') // OwnerDashboard view
    }
  }
}

function switchTab(registerMode) {
  isRegistering.value = registerMode
  startUI()
}

onMounted(() => {
  startUI()
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is already logged in —> fetch their role from Firestore
      const docSnap = await getDoc(doc(db, "users", user.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Redirect them straight to their dashboard
        if (data.role === 'customer') {
          router.push('/customer/menu')
        } else {
          router.push('/owner/dashboard')
        }
      }
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

.input-field {
  font-size: 1.5rem;
  margin: 5px 0px 15px 0px;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  height: 2%;
}

label {
  font-size: 1rem;
  font-weight: 600;
  color: black;
}

.submit-btn-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 20%;
}

.submit-btn {
  width: 50%;
  height: 100%;
  padding: 8px;
  font-size: 1.2rem;
  border-radius: 10px;
  background-color: #f77519;
  color: white;
  font-family: inherit;
  cursor: pointer;
}

</style>
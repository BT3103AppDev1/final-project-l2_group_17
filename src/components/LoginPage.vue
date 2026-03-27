<template>
  <div class="wrapper">
    <div class="card">
      <!-- Tab buttons to select login or registering -->
      <div class="tabs">
        <!-- Login button -->
        <button :class="['tab', { active: !isRegistering }]"
          @click="isRegistering = false"
        >
        Login
        </button>
        
        <!-- Register button -->
        <button :class="['tab', { active: isRegistering }]"
          @click="isRegistering = true"
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

      <!-- Fields for register only -->
      <div v-if="isRegistering" class="field">
        <label>Full Name</label><br>
        <input v-model="fullName" class="input-field" type="text" placeholder="Enter your full name" />
      </div>

      <!-- Email field for both login and register -->
      <div class="field">
        <label>Email</label><br>
        <input v-model="email" class="input-field" type="email" placeholder="your@email.com" />
      </div>

      <!-- Password field for both login and register -->
      <div class="field">
        <label>Password</label><br>
        <input v-model="password" class="input-field" type ="password" placeholder="Enter password" />
      </div>

      <!-- Phone number field for register only -->
      <div v-if="isRegistering" class="field">
        <label>Phone Number</label><br>
        <input v-model="phone" class="input-field" type="phone" placeholder="87654321" />
      </div>

      <!-- Error and success messages -->
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success">{{ successMsg }}</p>

      <!-- Submit button -->
      <div class="submit-btn-wrapper">
        <button @click="handleSubmit" class="submit-btn">{{ isRegistering ? "Create Account" : "Login" }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { auth } from "../firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

const email = ref("")
const password = ref("")
const fullName = ref("")
const phone = ref("")

// UI state
const isRegistering = ref(false) //login tab
const role = ref("customer")
const errorMsg = ref("")
const successMsg = ref("")

async function handleSubmit() {
  errorMsg.value = "";
  successMsg.value = "";

  if (!email.value || !password.value) {
    errorMsg.value = "Please fill in all required fields"
    return
  }

  try {
    if (isRegistering.value) {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
      successMsg.value = "Account created as ${role.value}! You can now log in."
      isRegistering = false
    } else {
      await signInWithEmailAndPassword(auth, email.value, password.value)
      successMsg.value = "Logged in as ${role.value}!"
    }

    // clear fields
    email.value = ""
    password.value = ""
    fullName.value = ""
    phone.value = ""
  } catch (error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        error.value = "This email is already registered."
        break

      case "auth/invalid-email":
        errorMsg.value = "Please enter a valid email."
        break
      
      case "auth/weak-password":
        errorMsg.value = "Password must be at least 6 characters."
        break
      
      default:
        errorMsg.value = "Something went wrong. Please try again."
    }
  }
}
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
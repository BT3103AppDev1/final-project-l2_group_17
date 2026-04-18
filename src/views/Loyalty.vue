<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where, increment } from "firebase/firestore"; 
import { useRouter } from "vue-router";
import NavCustomer from "@/components/NavCustomer.vue";

const router = useRouter();
const currentUser = ref(null);
const userData = ref({ points: 0 });
const referralInput = ref("");

let unsubscribeUser = null;

async function submitReferral() { 
  if (!referralInput.value) return 

  try {
    const code = referralInput.value.trim()

    const q = query(
      collection(db, "users"), 
      where("referralCode", "==", code)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      alert("Invalid referral code.")
      return
    }

    const referrerDoc = querySnapshot.docs[0]
    const referrerData = referrerDoc.id

    if (referrerData === currentUser.value.uid) {
      alert("You cannot use your own referral code.")
      return
    }
    await updateDoc(doc(db, "users", currentUser.value.uid), {
      referredBy: code
    })

    await updateDoc(doc(db, "users", referrerData), {
      points: increment(50) // change amount if needed
    })

    alert("Referral applied! Your friend received points.")
    
  } catch (error) {
    console.error("Error applying referral code:", error)
    alert("Failed to apply referral code. Please try again.")
  }
}

function copyReferralCode() {
  if (!userData.value.referralCode) return

  navigator.clipboard.writeText(userData.value.referralCode)
    .then(() => {
      alert("Referral code copied!")
    })
    .catch((err) => {
      console.error("Copy failed:", err)
    })
  }


onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userData.value = userDoc.data();
        }
      } catch (error) {
        console.error("Error fetching user points:", error);
      }
    } else {
      router.push("/");
    }
  });
});

onUnmounted(() => {
  if (unsubscribeUser) unsubscribeUser();
});
</script>

<template>
  <NavCustomer />
  <div v-if="currentUser" style="padding:0px 2%">
    <h1>Loyalty Program</h1>
    <p>Welcome, {{ userData.name || "Customer" }}!</p>
    <h2>Your Points: {{ userData.points }}</h2>
    <p>Points are updated automatically when you place a new order.</p>
    <p>
      Your Referral Code: {{ userData.referralCode }}
      <button @click="copyReferralCode">
        Copy
      </button>
    </p>
    <p>Share your referral code with friends! You earn points when they input your referral code.</p>

    <div v-if="!userData.referredBy">
      <h3>Have a referral code?</h3>

      <input
        v-model="referralInput"
        placeholder="Enter referral code"
      />

      <button
        @click="submitReferral"
      >
        Apply
      </button>

    </div>
  </div>
  <div v-else>
    <p>Please log in to view your points.</p>
  </div>
  
</template>

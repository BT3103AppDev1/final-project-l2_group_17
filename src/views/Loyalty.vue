<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore"; 
import { useRouter } from "vue-router";
import NavCustomer from "@/components/NavCustomer.vue";

const router = useRouter();
const currentUser = ref(null);
const userData = ref({ points: 0 });

let unsubscribeUser = null;

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
  <div v-if="currentUser">
    <h1>Loyalty Program</h1>
    <p>Welcome, {{ userData.name || "Customer" }}!</p>
    <h2>Your Points: {{ userData.points }}</h2>
    <p>Points are updated automatically when you place a new order.</p>
  </div>
  <div v-else>
    <p>Please log in to view your points.</p>
  </div>
</template>
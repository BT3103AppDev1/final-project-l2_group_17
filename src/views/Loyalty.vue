<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/firebase'
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import NavCustomer from '@/components/NavCustomer.vue'

const currentUser = ref(null);
const userData = ref({ points: 0 });
let unsubscribeUser = null;
let unsubscribeOrders = null;

// Function to update points in Firestore
const updatePointsInDB = async (totalPoints) => {
  if (currentUser.value) {
    const userRef = doc(db, "users", currentUser.value.uid);
    await updateDoc(userRef, {
      points: totalPoints
    });
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    currentUser.value = user;

    if (user) {
      // 1. Listen to User Profile (to display current role/info)
      unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) userData.value = docSnap.data();
      });

      // 2. Listen to Orders and Calculate Points
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", user.uid)
      );

      unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        let totalSpent = 0;
        snapshot.forEach((doc) => {
          // Assuming each order has a 'price' or 'totalPrice' field
          totalSpent += (doc.data().totalPrice || 0);
        });

        // Conversion Logic: e.g., $1 = 1 point
        const calculatedPoints = totalSpent;
        
        // Update Firestore so the "User Profile" listener catches the change
        updatePointsInDB(calculatedPoints);
      });

    } else {
      // Reset logic on logout
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeOrders) unsubscribeOrders();
      userData.value = { points: 0 };
    }
  });
});

onUnmounted(() => {
  if (unsubscribeUser) unsubscribeUser();
  if (unsubscribeOrders) unsubscribeOrders();
});
</script>

<template>
  <NavCustomer />
  <div v-if="currentUser">
    <h1>Loyalty Program</h1>
    <p>Welcome, {{ userData.name || 'Customer' }}!</p>
    <h2>Your Points: {{ userData.points }}</h2>
    <p>Points are updated automatically when you place a new order.</p>
  </div>
  <div v-else>
    <p>Please log in to view your points.</p>
  </div>
</template>
import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBxSzhCMKr-epEW-yJwe85lQhwHWZn_i1o',
  authDomain: 'bt3103-70b7d.firebaseapp.com',
  projectId: 'bt3103-70b7d',
  storageBucket: 'bt3103-70b7d.firebasestorage.app',
  messagingSenderId: '574019471602',
  appId: '1:574019471602:web:4babd3dece68055c90286b',
  measurementId: 'G-SLM2HSG65D',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

let analytics = null

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

export { app, analytics, auth, db }
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

export const VERIFICATION_MESSAGES = {
  customerOrder: 'Verify your email to place orders.',
  customerReview: 'Verify your email to leave reviews.',
  profileEdit: 'Verify your email to edit your profile.',
  adminAction: 'Verify your email to make admin changes.',
}

export function watchEmailVerification(onChange) {
  return onAuthStateChanged(auth, (user) => {
    onChange(Boolean(user?.emailVerified), user || null)
  })
}

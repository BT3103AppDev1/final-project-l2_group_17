import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const REVIEWS_COLLECTION = 'reviews'

function getTimestampMillis(timestamp) {
  if (!timestamp) return 0

  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().getTime()
  }

  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function sortReviewsDescending(reviews) {
  return [...reviews].sort(
    (left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt),
  )
}

function sortReviewsForMenu(reviews) {
  return [...reviews].sort((left, right) => {
    const ratingDifference = Number(right.rating || 0) - Number(left.rating || 0)

    if (ratingDifference !== 0) {
      return ratingDifference
    }

    return getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt)
  })
}

function mapReviewDoc(reviewDoc) {
  return {
    id: reviewDoc.id,
    ...reviewDoc.data(),
  }
}

export function buildReviewItemKey(orderDocId, menuItemId) {
  return `${orderDocId}::${menuItemId}`
}

export function subscribeToReviewsByUserId(userId, onData, onError) {
  if (!userId) {
    throw new Error('userId is required to subscribe to user reviews.')
  }

  const reviewsQuery = query(collection(db, REVIEWS_COLLECTION), where('userId', '==', userId))

  return onSnapshot(
    reviewsQuery,
    (snapshot) => {
      onData(sortReviewsDescending(snapshot.docs.map(mapReviewDoc)))
    },
    onError,
  )
}

export function subscribeToAllReviews(onData, onError) {
  return onSnapshot(
    collection(db, REVIEWS_COLLECTION),
    (snapshot) => {
      onData(sortReviewsDescending(snapshot.docs.map(mapReviewDoc)))
    },
    onError,
  )
}

export function buildMenuItemReviewSummaries(reviews = []) {
  return reviews.reduce((summaries, review) => {
    if (!review.menuItemId) {
      return summaries
    }

    const existingSummary = summaries[review.menuItemId] || {
      reviewCount: 0,
      totalRating: 0,
      averageRating: 0,
      recentReviews: [],
    }

    const nextReviewCount = existingSummary.reviewCount + 1
    const totalRating = existingSummary.totalRating + Number(review.rating || 0)
    const topReviews = sortReviewsForMenu([
      ...existingSummary.recentReviews,
      review,
    ]).slice(0, 2)

    summaries[review.menuItemId] = {
      reviewCount: nextReviewCount,
      totalRating,
      averageRating: totalRating / nextReviewCount,
      recentReviews: topReviews,
    }

    return summaries
  }, {})
}

<template>
    <NavAdmin />
    <section class="page-shell">
        <header class="page-header">
            <div>
                <h1>Dashboard</h1>
                <p class="body-copy">
                    Monitor daily pickups and order performance at a glance.
                </p>
            </div>
        </header>

        <div class="content-panel">
            <Dashboard />
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavAdmin from '../components/NavAdmin.vue';
import Dashboard from '../components/Dashboard.vue';

// Firebase imports for the preview
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// --- State ---
const recentReviews = ref([]);
const loadingReviews = ref(true);
// --- Fetch the 3 latest reviews ---
const fetchRecentReviews = async () => {
    try {
        // Notice the limit(3) - this keeps the dashboard fast and uncluttered
        const q = query(
            collection(db, 'reviews'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );
        const querySnapshot = await getDocs(q);
        
        recentReviews.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching recent reviews:", error);
    } finally {
        loadingReviews.value = false;
    }
};

onMounted(() => {
    fetchRecentReviews();
});
// --- Helpers ---
const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};
const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    return timestamp.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric'
    });
};
</script>

<style scoped>
.page-shell {
    display: grid;
    gap: 20px;
    padding-bottom: 40px;
    padding: 2%
}

.page-header,
.content-panel,
.review-preview-panel {
    border: 1px solid rgba(91, 57, 36, 0.12);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
    border-radius: 28px;
}

.page-header {
    padding: 28px;
    border-radius: 28px;
}

h1,
.body-copy {
    margin: 0;
}

h1 {
    color: #3f220f;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.body-copy {
    margin-top: 12px;
    color: #6f5545;
    max-width: 720px;
    line-height: 1.6;
}

.content-panel {
    border-radius: 28px;
    padding: 10px;
}

.reviews-preview-panel {
    padding: 28px;
}
.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.preview-header h2 {
    color: #3f220f;
    font-size: 1.5rem;
    margin: 0;
}
.view-all-btn {
    color: #b05a2b;
    text-decoration: none;
    font-weight: bold;
    padding: 8px 16px;
    background: rgba(176, 90, 43, 0.1);
    border-radius: 12px;
    transition: background 0.2s;
}
.view-all-btn:hover {
    background: rgba(176, 90, 43, 0.2);
}
.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}
.preview-card {
    background: #fffaf6;
    border: 1px solid rgba(91, 57, 36, 0.1);
    padding: 16px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
}
.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.stars {
    color: #f77519;
    letter-spacing: 2px;
}
.date {
    font-size: 0.85rem;
    color: #8d684e;
}
.preview-text {
    color: #472715;
    font-style: italic;
    font-size: 0.95rem;
    margin: 0 0 12px 0;
    line-height: 1.4;
    overflow-wrap: break-word;
    word-break: break-word;
    flex-grow: 1;
}
.preview-user {
    font-size: 0.85rem;
    color: #8d684e;
    font-weight: 600;
}
.loading-state, .empty-state {
    color: #6f5545;
    padding: 20px 0;
    font-style: italic;
}
</style>
<template>
    <NavAdmin />
    <section class="page-shell">
        <header class="page-header">
            <div>
                <h1>Pickup calendar</h1>
                <p class="body-copy">
                    View scheduled pickups by date and review each order timeline.
                </p>
            </div>
        </header>

        <div class="content-panel">
            <Calendar />
        </div>
    </section>
</template>

<script setup>
import Calendar from '../components/Calendar.vue'
import NavAdmin from '../components/NavAdmin.vue'
</script>

<style scoped>
.page-shell {
    display: grid;
    gap: 20px;
}

.page-header,
.content-panel {
    border: 1px solid rgba(91, 57, 36, 0.12);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
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
    padding: 16px;
}
</style>

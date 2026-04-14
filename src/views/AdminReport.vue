<script setup>
import { onMounted, onUnmounted } from 'vue'
import NavAdmin from '../components/NavAdmin.vue'
import { Line } from 'vue-chartjs'
import dollarIcon from '../assets/dollar-symbol.png'
import warehouseIcon from '../assets/warehouse.svg'
import revenueIcon from '../assets/revenue.svg'
import baravgIcon from '../assets/bar-average.svg'
import { chartOptions, useAdminReportData } from '@/services/adminreport'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const {
    loading,
    errorMessage,
    totalOrders,
    completedOrders,
    totalRevenue,
    averageOrderValue,
    monthlyRevenueData,
    orderStatuses,
    topSellingItems,
    statusBarWidth,
    startOrdersSubscription,
    stopOrdersSubscription,
} = useAdminReportData()

onMounted(() => {
    startOrdersSubscription()
})

onUnmounted(() => {
    stopOrdersSubscription()
})
</script>


<template>
    <NavAdmin />
    <section class="page-shell">
        <header class="page-header">
            <div>
                <h1>Sales reports</h1>
                <p class="body-copy">
                    Review revenue trends, order distribution, and top-performing items.
                </p>
            </div>
        </header>

        <div class="reports-container">

        <div v-if="loading" class="message-card">Loading reports...</div>
        <div v-else-if="errorMessage" class="message-card error">{{ errorMessage }}</div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <h3>Total Revenue</h3>
                    <span class="stat-icon"><img :src="dollarIcon" alt="Revenue" class="icon-img" /></span>
                </div>
                <div class="stat-value">${{ totalRevenue.toFixed(2) }}</div>
                <p class="stat-subtitle">From {{ completedOrders }} completed orders</p>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <h3>Average Order Value</h3>
                    <span class="stat-icon"><img :src="baravgIcon" alt="Average Order Value" class="icon-img" /></span>
                </div>
                <div class="stat-value">${{ averageOrderValue.toFixed(2) }}</div>
                <p class="stat-subtitle">Per order</p>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <h3>Total Orders</h3>
                    <span class="stat-icon"><img :src="warehouseIcon" alt="Total Orders" class="icon-img" /></span>
                </div>
                <div class="stat-value">{{ totalOrders }}</div>
                <p class="stat-subtitle">All time</p>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-container">
                <div class="chart-title">
                    <img :src="revenueIcon" alt="Monthly Revenue" class="chart-icon" />
                    <h2>Monthly Revenue</h2>
                </div>
                <div class="chart-wrapper">
                    <Line :data="monthlyRevenueData" :options="chartOptions" />
                </div>
            </div>

            <div class="status-breakdown">
                <h2>Order Status Breakdown</h2>
                <div class="status-list">
                    <div class="status-item" :class="status.key" v-for="status in orderStatuses" :key="status.key">
                        <span class="status-name">{{ status.name }}</span>
                        <div class="status-bar">
                            <div class="status-progress" :style="{ width: statusBarWidth(status.count) }"></div>
                        </div>
                        <span class="status-count">{{ status.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="top-items">
            <h2>Top Selling Items</h2>
            <div class="items-content">
                <div v-if="topSellingItems.length > 0" class="items-table">
                    <div class="items-header">
                        <span class="items-header-spacer" aria-hidden="true">#</span>
                        <span>Item Name</span>
                        <span class="items-header-right">Quantity Sold</span>
                        <span class="items-header-right">Revenue</span>
                    </div>
                    <div class="item-row" v-for="(item, index) in topSellingItems" :key="item.key">
                        <span class="item-rank">#{{ index + 1 }}</span>
                        <div class="item-name-block">
                            <span class="item-name">{{ item.name }}</span>
                            <span class="item-subtitle">${{ item.unitPrice.toFixed(2) }} each</span>
                        </div>
                        <span class="item-quantity">{{ item.quantity }}</span>
                        <span class="item-revenue">${{ item.revenue.toFixed(2) }}</span>
                    </div>
                </div>
                <p v-else class="no-data">No sales data yet</p>
            </div>
        </div>
        </div>
    </section>
</template>


<style scoped>
.page-shell {
    display: grid;
    gap: 20px;
}

.page-header,
.message-card,
.stat-card,
.chart-container,
.status-breakdown,
.top-items {
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
    max-width: 720px;
    line-height: 1.6;
    color: #6f5545;
}

.reports-container {
    padding: 0.25rem;
    max-width: 1400px;
    margin: 0;
}

.message-card {
    padding: 1rem 1.25rem;
    border-radius: 20px;
    margin-bottom: 1rem;
    color: #6f5545;
}

.message-card.error {
    background: #fff1f1;
    color: #b42318;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    padding: 1.5rem;
    border-radius: 20px;
    border-left: 4px solid #b85c38;
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.stat-header h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #8d684e;
}

.stat-icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-img {
    width: 1.5rem;
    height: 1.5rem;
    object-fit: contain;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #472715;
    margin-bottom: 0.35rem;
}

.stat-subtitle {
    margin: 0;
    font-size: 0.85rem;
    color: #8d684e;
}

.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.chart-container,
.status-breakdown {
    padding: 1.5rem;
    border-radius: 20px;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.chart-icon {
    width: 1.5rem;
    height: 1.5rem;
    object-fit: contain;
}

.chart-container h2,
.status-breakdown h2,
.top-items h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #3f220f;
}

.chart-title h2 {
    margin: 0;
    line-height: 1.2;
}

.chart-wrapper {
    position: relative;
    height: 300px;
}

.status-list {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
}

.status-item {
    display: grid;
    grid-template-columns: 96px 1fr 32px;
    align-items: center;
    gap: 1rem;
}

.status-name {
    font-weight: 500;
    color: #555;
}

.status-bar {
    height: 14px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
}

.status-progress {
    height: 100%;
    background: linear-gradient(90deg, #e5e7eb, #d1d5db);
    border-radius: 999px;
    transition: width 0.3s ease;
}

.status-item.pending .status-progress {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.status-item.confirmed .status-progress {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.status-item.preparing .status-progress {
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
}

.status-item.ready_for_pickup .status-progress {
    background: linear-gradient(90deg, #86efac, #bbf7d0);
}

.status-item.completed .status-progress {
    background: linear-gradient(90deg, #15803d, #22c55e);
}

.status-item.cancelled .status-progress {
    background: linear-gradient(90deg, #ef4444, #f87171);
}

.status-count {
    font-weight: bold;
    color: #111;
    text-align: right;
}

.top-items {
    padding: 1.5rem;
    border-radius: 20px;
}

.items-content {
    overflow-x: auto;
}

.items-table {
    min-width: 760px;
}

.items-header,
.item-row {
    display: grid;
    grid-template-columns: 60px 1.6fr 0.9fr 0.7fr;
    align-items: center;
    gap: 1rem;
}

.items-header {
    padding: 0 0.75rem 0.75rem;
    color: #111;
    font-weight: 700;
    border-bottom: 1px solid #e5e7eb;
}

.items-header-spacer {
    visibility: hidden;
}

.items-header-right {
    text-align: right;
}

.item-row {
    padding: 0.95rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
}

.item-rank {
    font-weight: 700;
    color: #6b7280;
}

.item-name-block {
    display: flex;
    flex-direction: column;
}

.item-name {
    color: #3f220f;
    font-weight: 600;
}

.item-subtitle,
.item-quantity {
    color: #6b7280;
    font-size: 0.92rem;
}

.item-quantity,
.item-revenue {
    text-align: right;
}

.item-revenue {
    font-weight: bold;
    color: #b85c38;
}

.no-data {
    text-align: center;
    color: #999;
    padding: 2rem;
    margin: 0;
}

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }

    .item-row,
    .items-header {
        grid-template-columns: 40px 1fr;
    }

    .items-header span:nth-child(3),
    .items-header span:nth-child(4),
    .item-quantity,
    .item-revenue {
        display: none;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    h1 {
        font-size: 1.5rem;
    }
}
</style>

<template>
    <NavAdmin />
    <div class="reports-container">
        <h1>Sales Reports</h1>

        <!-- statistics Cards -->
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

        <!-- Charts Grid -->
        <div class="charts-grid">
            <!-- Monthly Revenue Chart -->
            <div class="chart-container">
                <div class="chart-title">
                    <img :src="revenueIcon" alt="Monthly Revenue" class="chart-icon" />
                    <h2>Monthly Revenue</h2>
                </div>
                <div v-if="monthlyRevenueData" class="chart-wrapper">
                    <Bar :data="monthlyRevenueData" :options="chartOptions" />
                </div>
                <p v-else class="no-data">No data available</p>
            </div>

            <!-- Order Status Breakdown -->
            <div class="status-breakdown">
                <h2>Order Status Breakdown</h2>
                <div class="status-list">
                    <div class="status-item" v-for="status in orderStatuses" :key="status.name">
                        <span class="status-name">{{ status.name }}</span>
                        <div class="status-bar">
                            <div class="status-progress" :style="{ width: status.count * 5 + '%' }"></div>
                        </div>
                        <span class="status-count">{{ status.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Selling Items -->
        <div class="top-items">
            <h2>Top Selling Items</h2>
            <div class="items-content">
                <div v-if="topSellingItems.length > 0" class="items-list">
                    <div class="item-row" v-for="(item, index) in topSellingItems" :key="index">
                        <span class="item-rank">{{ index + 1 }}</span>
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-quantity">{{ item.quantity }} sold</span>
                        <span class="item-revenue">${{ item.revenue.toFixed(2) }}</span>
                    </div>
                </div>
                <p v-else class="no-data">No sales data yet</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import NavAdmin from '../components/NavAdmin.vue'
import { Bar } from 'vue-chartjs'
import dollarIcon from '../assets/dollar-symbol.png'
import warehouseIcon from '../assets/warehouse.svg'
import revenueIcon from '../assets/revenue.svg'
import baravgIcon from '../assets/bar-average.svg'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
)

// Placeholder data
const totalRevenue = 0
const completedOrders = 0
const averageOrderValue = 0
const totalOrders = 0

const monthlyRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
        {
            label: 'Revenue',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            borderRadius: 4
        }
    ]
}

const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function(value) {
                    return '$' + value
                }
            }
        }
    }
}

const orderStatuses = [
    { name: 'Pending', count: 0 },
    { name: 'Confirmed', count: 0 },
    { name: 'Preparing', count: 0 },
    { name: 'Ready', count: 0 },
    { name: 'Completed', count: 0 },
    { name: 'Cancelled', count: 0 }
]

const topSellingItems = []
</script>

<style scoped>
.reports-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    background-color: #f9f9f9;
    min-height: 100vh;
}

h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: #333;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #f77519;
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
    color: #666;
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
    color: #333;
    margin-bottom: 0.5rem;
}

.stat-subtitle {
    margin: 0;
    font-size: 0.85rem;
    color: #999;
}

/* Charts Grid */
.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.chart-container,
.status-breakdown {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
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
    color: #333;
}

.chart-title h2 {
    margin: 0;
    line-height: 1.2;
}

.chart-wrapper {
    position: relative;
    height: 300px;
}

/* Status Breakdown */
.status-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.status-item {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    align-items: center;
    gap: 1rem;
}

.status-name {
    font-weight: 500;
    color: #555;
}

.status-bar {
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
}

.status-progress {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    border-radius: 10px;
    transition: width 0.3s ease;
}

.status-count {
    font-weight: bold;
    color: #333;
}

/* Top Selling Items */
.top-items {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.items-content {
    overflow-x: auto;
}

.items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.item-row {
    display: grid;
    grid-template-columns: 40px 1fr 100px 100px;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 4px;
}

.item-rank {
    font-weight: bold;
    color: #3498db;
    text-align: center;
}

.item-name {
    color: #333;
    font-weight: 500;
}

.item-quantity {
    color: #666;
    text-align: right;
}

.item-revenue {
    font-weight: bold;
    color: #27ae60;
    text-align: right;
}

.no-data {
    text-align: center;
    color: #999;
    padding: 2rem;
    margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }

    .item-row {
        grid-template-columns: 1fr;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    h1 {
        font-size: 1.5rem;
    }
}
</style>

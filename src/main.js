import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 1. Import your router settings

const app = createApp(App)

app.use(router) // 2. This "registers" router-link and router-view globally

app.mount('#app')
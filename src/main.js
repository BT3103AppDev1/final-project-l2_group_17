import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'

app.use(router)

createApp(App).mount('#app')
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PhIcon from './components/PhIcon.vue'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 註冊 Phosphor Icons 元件
app.component('ph-icon', PhIcon)

app.mount('#app')

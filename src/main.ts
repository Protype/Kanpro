import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import PhIcon from './components/PhIcon.vue'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 註冊 Phosphor Icons 元件
app.component('ph-icon', PhIcon)

app.mount('#app')

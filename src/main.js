import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { WebMidi } from "webmidi"

// create Vue App
const app = createApp(App)
// Inject WEBMIDI.js Singleton
app.config.globalProperties.$webmidi = WebMidi
// start App
app.mount('#app')

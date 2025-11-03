import { createMemoryHistory, createRouter } from 'vue-router'

import LandingPage from '../components/LandingPage.vue'
import QuizHome from '../components/QuizHome.vue'
import About from '../components/About.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingPage },
  { path: '/answer-selection', name: 'answer-selection', component: QuizHome },
  { path: '/about', name: 'about', component: About },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

import { createMemoryHistory, createRouter } from 'vue-router'

import QuizHome from '../components/QuizHome.vue';
import About from '../components/About.vue';

const routes = [
  { path: '/', component: QuizHome },
  { path: '/about', component: About },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
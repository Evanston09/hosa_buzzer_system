import { createMemoryHistory, createRouter } from 'vue-router'

import Home from '../components/Home.vue';
import QuizHome from '../components/QuizHome.vue';
import About from '../components/About.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/quiz', component: QuizHome },
  { path: '/about', component: About },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
import { createMemoryHistory, createRouter } from 'vue-router'

import QuizHome from '../components/QuizHome.vue';
import HomePage from '../components/HomePage.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/quiz', component: QuizHome },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

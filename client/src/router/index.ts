import { createMemoryHistory, createRouter } from 'vue-router'

import LobbyHome from '../components/LobbyHome.vue';
import About from '../components/About.vue';
import HomePage from '../components/HomePage.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/lobby', component: LobbyHome },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

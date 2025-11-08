import { createMemoryHistory, createRouter } from 'vue-router'

import LobbyHome from '../components/LobbyHome.vue';
import About from '../components/About.vue';
import HomePage from '../components/HomePage.vue';
import Game from '../components/Game.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/lobby', component: LobbyHome },
  { path: '/game', component: Game },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

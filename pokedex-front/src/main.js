

// inladen van vue en vue-router 

import {createApp} from 'vue/dist/vue.esm-bundler';

import {createRouter, createWebHashHistory} from 'vue-router';



// jouw components 

import PokemonIndex from './components/pokemon-index.vue'

import PokemonDetail from './components/pokemon-detail.vue'

import register from './components/register.vue'

import login from './components/login.vue'

import pokemonFavorite from "./components/pokemon-favorite.vue";

import UserView from "./components/UserView.vue";


const routes = [

    {path:'/pokemon',name: 'index', component: PokemonIndex},

    {path:'/pokemon/:id', component: PokemonDetail},

    {path:'/pokemon/register', component: register},

    {path:'/pokemon/login', component: login},

    {path:'/pokemon/favorites', component: pokemonFavorite},

    {path:'/pokemon/users', component: UserView},

]



const router=createRouter({

    history:createWebHashHistory(),

    routes:routes,

})



// start applicatie met router 

const app=createApp({})

app.use(router)

app.mount('#app') 
<script>
export default {
  name: "UserView",
  data() {
    return {
      user: [],
      favorite_pokemons: []
    };
  },
  async mounted() {
    try {
      const response = await fetch('http://localhost:3000/pokemons/users_and_favorite_pokemons')
      const data = await response.json();
      this.favorite_pokemons = data.favorite_pokemons.map(pokemonList => pokemonList.map(pokemon => pokemon.name));
      this.user = data.user;
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }
}
</script>

<template>
  <div>1
    <h1>Users</h1>
    <p class="user-details" v-for="(user, index) in user" :key="index">
      user name: {{ user }}<br>
      favorite pokemons: {{ favorite_pokemons[index].join(', ') }}
    </p>
  </div>
</template>

<style>
.user-details {
  margin: 10px;
  padding: 10px;
  border: 1px solid black;
  border-radius: 5px;
}
</style>
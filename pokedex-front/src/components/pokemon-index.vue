<template>
  <div>
    <PokemonSearch />
    <checkLogin/>
    <h1>Pokemons</h1>
    <ul class="pokemon-list">
      <li class="pokemon-info" v-for="pokemon in pokemons" :key="pokemon.id">
        <span class="pokemon-details">
          pokemon name: <router-link :to="{ path: `/pokemon/${pokemon.id}` }">{{ pokemon.name }}</router-link>
        </span>
        <button class="button" @click="addToInventory(pokemon.name)">Add to inventory</button>
        <button class="button" @click="addToInventoryAndFavorite(pokemon.name)">add to inventory as favorite</button>
      </li>
    </ul>

  </div>
</template>

<script>
import PokemonSearch from './pokemon-search.vue';
import checkLogin from './check-login.vue';


export default {
  name: 'PokemonIndex',
  components: {
    PokemonSearch,
    checkLogin
  },
  data() {
    return {
      pokemons: [],
    };
  },
  async mounted() {
    const response = await fetch('http://localhost:3000/pokemons');
    this.pokemons = await response.json();
  },
  methods: {
    async addToInventory(pokemonName) {
      try {
        const response = await fetch('http://localhost:3000/pokemons/add?favorite=false&pokemon=' + pokemonName, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify({ pokemons: pokemonName }),
        });
        const result = await response.json();
      } catch (error) {
        console.error('Error adding to favorite:', error);
      }
    },
    async addToInventoryAndFavorite(pokemonName) {
      try {
        const response = await fetch('http://localhost:3000/pokemons/add?favorite=true&pokemon=' + pokemonName,  {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify({ pokemons: pokemonName }),
        });
        const result = await response.json();
      } catch (error) {
        console.error('Error adding to favorite:', error);
      }
    },
  },
};
</script>

<style scoped>
.pokemon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pokemon-info {
  flex: 1 1 calc(25% - 20px); /* Adjust the percentage to control the number of items per row */
  box-sizing: border-box;
  margin: 10px;
  padding: 10px;
  border: 1px solid black;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}


</style>
<template>
  <div>
    <input
        type="search"
        v-model="searchTerm"
        @input="searchPokemon"
        placeholder="Search for a pokemon"
    />
    <ul>
      <li v-for="pokemon in pokemons" :key="pokemon.id">
        <router-link :to="{ path: `/pokemon/${pokemon.id}` }">{{ pokemon.name }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'PokemonSearch',
  data() {
    return {
      searchTerm: '',
      pokemons: [],
    };
  },
  methods: {
    async searchPokemon() {
      if (this.searchTerm.length > 2) {
        const response = await fetch(`http://localhost:3000/pokemons/search?searchTerm=${this.searchTerm}`);
        this.pokemons = await response.json();
      } else {
        this.pokemons = [];
      }
    },
  },
};
</script>

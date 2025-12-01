<script>
export default {
  name: 'PokemonFavorite',
  data() {
    return {
      pokemons_info: [],
      pokemon_user_info: [],
    };
  },
  async mounted() {
    try {
      const response = await fetch('http://localhost:3000/pokemons/favorite', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
      });
      const data = await response.json();
      this.pokemons_info = data.favorite_pokemons;
      this.pokemon_user_info = data.info_pokemon_user;
    } catch (error) {
      console.error('Error fetching favorite pokemons:', error);
    }
  },
  methods: {
    isFavorite(pokemonId) {
      return this.pokemon_user_info.some(info => info.pokemon_id === pokemonId && info.favorite === 1);
    },
    async removeFavoriteText(pokemonName, pokemonId) {
      try {
        const response = await fetch('http://localhost:3000/pokemons/favorite/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify({ pokemon: pokemonName }),
        });

        if (response.ok) {
          // Update the local state to reflect the removal of the favorite status
          this.pokemon_user_info = this.pokemon_user_info.map(info => {
            if (info.pokemon_id === pokemonId && info.favorite === 1) {
              info.favorite = 0;
            }
            return info;
          });
        } else {
          console.error('Error removing favorite text:', await response.text());
        }
      } catch (error) {
        console.error('Error removing favorite text:', error);
      }
    },
    async removePokemonList(pokemonName, pokemonId) {
      try {
        const response = await fetch('http://localhost:3000/pokemons/remove/user_pokemon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
          },
          body: JSON.stringify({ pokemon: pokemonName }),
        });

        if (response.ok) {
          // Update the local state to reflect the removal of the favorite status
          this.pokemons_info = this.pokemons_info.filter(pokemon => pokemon.id !== pokemonId);
        } else {
          console.error('Error removing favorite text:', await response.text());
        }
      } catch (error) {
        console.error('Error removing favorite text:', error);
      }
    },
  }
}
</script>

<template>
  <div>
    <h1>Pokemon Favorite</h1>
    <span v-if="pokemons_info.length === 0">No favorite pokemons or you are not logged in</span>
    <div class="pokemon-info" v-for="pokemon in pokemons_info" :key="pokemon.id">
      <span class="pokemon-details">
        pokemon name: {{ pokemon.name }}
        <span v-if="isFavorite(pokemon.id)" class="pokemon-favorite"> Favorite </span>
        <button v-if="isFavorite(pokemon.id)" @click="removeFavoriteText(pokemon.name, pokemon.id)">Remove from favorite</button>
        <button @click="removePokemonList(pokemon.name, pokemon.id)">Remove pokemon</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.pokemon-info {
  margin: 10px;
  display: flex;
  justify-content: space-between;
  padding: 10px;
  font-size: 40px;
  border: 1px solid black;
  border-radius: 5px;
}

.pokemon-favorite {
  color: red;
  font-weight: bold;
  margin-left: 10px;
}

.pokemon-details {
  margin-right: 10px;
}
</style>
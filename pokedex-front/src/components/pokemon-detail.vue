<template>
  <div>
    <h1>Pokemons</h1>
    <div class="pokemon-info">
      <p class="pokemon-details">pokemon weight: {{ pokemon_info.weight }}</p>
      <p class="pokemon-details">pokemon name: {{ pokemon_info.name }}</p>
      <p class="pokemon-details">pokemon base experience: {{ pokemon_info.base_experience }}</p>

    </div>
  </div>
</template>

<script>
export default {
  name: 'PokemonDetail',
  data() {
    return {
      pokemon_info: {},
    };
  },
  async mounted() {
    const response = await fetch('http://localhost:3000/pokemon/get?id=' + this.$route.params.id);
    this.pokemon_info = await response.json();
  },
};
</script>

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

.pokemon-details {
  margin-right: 10px;
}
</style>
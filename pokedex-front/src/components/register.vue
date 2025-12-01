<script>
export default {
  name: 'Register',
  data() {
    return {
      input: {
        email: '',
        username: '',
        password: ''
      },
      error: [],
    }
  },
  methods: {
    async register_user() {
      try {
        const response = await fetch('http://localhost:3000/pokemons/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.input)
        });
        const result = await response.json();
        if (result.success) {
          this.$router.push({ name: 'index' });
        }
      } catch (error) {
        this.error = error;
        console.error('Error:', error);
      }
    }
  }
};
</script>

<template>
  <div>
    <h1>Register</h1>
    <form @submit.prevent="register_user">
      <label for="email">Email:</label>
      <input type="text" required id="email" v-model="input.email" name="email"><br><br>
      <label for="username">Username:</label>
      <input type="text"  required id="username" v-model="input.username" name="username"><br><br>
      <label for="password">Password:</label>
      <input type="password" required id="password" v-model="input.password" name="password"><br><br>
      <input type="submit" value="Submit">
    </form>
  </div>
</template>

<style scoped>
/* Add your styles here */
</style>
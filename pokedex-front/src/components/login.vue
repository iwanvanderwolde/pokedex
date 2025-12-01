<script>
export default {
  name: "Login",
  data() {
    return {
      input: {
        email_or_username: "",
        password: "",
      },
    };
  },
  methods: {
    async login_user() {
      try {
        const response = await fetch('http://localhost:3000/pokemons/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.input)
        });
        const result = await response.json();
        localStorage.setItem('token', result.token);
        if (result.success) {
          this.$router.push({name: 'index'});
        }
      } catch (error) {
        console.error('Error:', error);
        return {success: false, message: 'Error logging in'
      }
    }
  }
}};


</script>

<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login_user">
      <label for="email_or_username">Email or Username:</label>
      <input type="text" id="email_or_username" v-model="input.email_or_username" name="email_or_username"><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password" v-model="input.password" name="password"><br><br>
      <input type="submit" value="Submit">
    </form>
  </div>
</template>

<style>

</style>
<script>
import makeSocket from './make-socket.vue';
export default {
  name: 'checkLogin',
  components: {
    makeSocket
  },
  data() {

    return {
      loggedIn: false,
    };
  },
  mounted() {
    console.log("testing")
    this.loggedIn = !!localStorage.getItem('token');
  },
};

</script>

<template>
  <div>
    <h1 v-if="loggedIn"><makeSocket/></h1>
    <h1 v-else>You are not logged in</h1>
  </div>
</template>
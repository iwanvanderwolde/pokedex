<script>
import { defineComponent } from "vue";
import { socket } from "../socket.js";

export default defineComponent({
  name: 'makeSocket',
  data() {
    return {
      name: null, // Store the user's name
      message: '',
      messages: [],
    };
  },
  mounted() {
    socket.on('chat message', (msg) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    socket.on('user connected', (msg) => {
      if (!this.name) {
        this.name = msg.name; // Set the user's name only if it is not already set
      }
      this.messages.push(msg.message);
      this.scrollToBottom();
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.messages.push(this.name +  ' disconnected from server');
    });
  },
  methods: {
    sendMessage(msg) {
      if (msg.trim() !== '') {
        const fullMessage = this.name + ': ' + msg;
        console.log('Sending message:', fullMessage);
        socket.emit('chat message', fullMessage);
        this.message = ''; // Clear the input field
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const messagesContainer = this.$el.querySelector('#messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
    }
  }
});
</script>

<template>
  <h6 class="title">Chat</h6>
  <div class="chat">

    <ul id="messages">
      <li v-for="message in messages" :key="message">{{ message }}</li>
    </ul>
    <form class="message-form" @submit.prevent="sendMessage(message)">
      <input v-model="message" autocomplete="off" />
      <button>Send</button>
    </form>
  </div>
</template>

<style scoped>

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.message-form {
  display: flex;
  justify-content: flex-start;
  margin-top: 10px;
}

.chat {
  border: 2px solid black;
  padding: 10px;
  border-radius: 5px;
}

#messages {
  list-style-type: none;
  margin: 0;
  padding: 2px;
  border-color: black;
  max-height: 150px;
  overflow-y: auto;
}

#messages li {
  padding: 2px;
  margin-bottom: 10px;
  background-color: #f4f4f4;
  border-radius: 4px;
  font-size: 24px;
}
</style>
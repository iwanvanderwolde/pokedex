<script>
import { defineComponent } from "vue";
import { socket } from "../socket.js";

export default defineComponent({
  name: 'makeSocket',
  data() {
    return {
      // Store the user's display name (set by server when available)
      name: null,
      // Current input value bound to the form
      message: '',
      // Collected chat messages shown in the UI
      messages: [],
    };
  },
  mounted() {
    // Incoming chat messages from other users
    socket.on('chat message', (msg) => {
      this.messages.push(msg);
      this.scrollToBottom(); // Ensure the latest message is visible
    });

    // When a user connects, the server may send a name and a message
    socket.on('user connected', (msg) => {
      // Only set the local name if it's not already set (prevents overwriting)
      if (!this.name) {
        this.name = msg.name;
      }
      this.messages.push(msg.message);
      this.scrollToBottom();
    });

    // Log connect errors for debugging
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    // Notify locally when disconnected; keep it simple and user-readable
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.messages.push(this.name + ' disconnected from server');
    });
  },
  methods: {
    sendMessage(msg) {
      // Avoid sending empty/whitespace-only messages
      if (msg.trim() !== '') {
        // Prepend the sender name for simple display; server could handle richer message objects
        const fullMessage = this.name + ': ' + msg;
        console.log('Sending message:', fullMessage);
        socket.emit('chat message', fullMessage);
        this.message = ''; // Clear the input field after sending
      }
    },
    scrollToBottom() {
      // Wait for DOM update so the new message element exists before scrolling
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
      <input v-model="message" autocomplete="off"/>
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

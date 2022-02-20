import App from './App.svelte';
import quotes from './data/quotes.js';

const randomIndex = Math.floor(Math.random() * quotes.length);

const app = new App({
  target: document.body,
  props: {
    quote: quotes[randomIndex]
  }
});

export default app;

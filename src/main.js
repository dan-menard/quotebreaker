import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    quote: {
      text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
      author: "Martin Fowler"
    }
  }
});

export default app;

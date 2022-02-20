import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    quote: {
      text: "ANY FOOL CAN WRITE CODE THAT A COMPUTER CAN UNDERSTAND. GOOD PROGRAMMERS WRITE CODE THAT HUMANS CAN UNDERSTAND.",
      author: "MARTIN FOWLER"
    }
  }
});

export default app;

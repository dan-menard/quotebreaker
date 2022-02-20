<script>
  import GameText from './GameText.svelte';
  import generateKey from './util/generateKey.js';

  export let quote;

  const {author, text} = quote;

  const key = generateKey();

  function parseIntoWordsAndLetters(string) {
    const words = string.split(' ');
    const wordsAndLetters = words.map((word) => word.split(''));

    return wordsAndLetters;
  }

  const words = parseIntoWordsAndLetters(text);
  const names = parseIntoWordsAndLetters(author);
</script>

<main>
  <GameText text={words} key={key} />
  <GameText text={names} key={key} />
</main>

<style>
</style>

<script>
  import GameText from './GameText.svelte';

  export let quote;

  const {author, text} = quote;

  function parseIntoWordsAndLetters(string) {
    const words = string.split(' ');
    const wordsAndLetters = words.map((word) => word.split(''));

    return wordsAndLetters;
  }

  const words = parseIntoWordsAndLetters(text);
  const names = parseIntoWordsAndLetters(author);
</script>

<main>
  <GameText text={words} />
  <GameText text={names} />
</main>

<style>
</style>

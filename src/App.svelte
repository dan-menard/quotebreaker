<script>
  import GameText from './GameText.svelte';
  import isLetter from './util/isLetter.js';
  import generateKey from './util/generateKey.js';

  export let quote;

  let activeLetter = null;
  let guessedLetters = {};
  let wordsValue = '';
  let authorValue = '';
  let gameOver = false;

  const {author, text} = quote;
  const key = generateKey();

  function parseIntoWordsAndLetters(string) {
    const words = string.toUpperCase().split(' ');
    const wordsAndLetters = words.map((word) => word.split(''));

    return wordsAndLetters;
  }

  function formatGuess(guess) {
    return guess.flat().filter((char) => isLetter(char)).join('');
  }

  const words = parseIntoWordsAndLetters(text);
  const names = parseIntoWordsAndLetters(author);

  $: {
    const answer = formatGuess(words || []) + formatGuess(names || []);
    const guess = wordsValue.toUpperCase() + authorValue.toUpperCase();

    if (guess === answer) {
      gameOver = true;
    }
  }
</script>

<main>
  <GameText
    key={key}
    text={words}
    bind:value={wordsValue}
    bind:activeLetter={activeLetter}
    bind:guessedLetters={guessedLetters} />

  <GameText
    key={key}
    text={names}
    bind:value={authorValue}
    bind:activeLetter={activeLetter}
    bind:guessedLetters={guessedLetters} />

  {#if (gameOver)}
    <div class="winMessage">
      You win!
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 40px auto;
  }

  .winMessage {
  }
</style>

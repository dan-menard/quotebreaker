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
  let gameOverEl;
  let gameBoardEl;

  const {author, text} = quote;
  const key = generateKey();

  const words = parseIntoWordsAndLetters(text);
  const names = parseIntoWordsAndLetters(author);

  function parseIntoWordsAndLetters(string) {
    const words = string.toUpperCase().split(' ');
    const wordsAndLetters = words.map((word) => word.split(''));

    return wordsAndLetters;
  }

  function formatGuess(guess) {
    return guess.flat().filter((char) => isLetter(char)).join('');
  }

  function checkForWin(wordGuess, authorGuess) {
    const answer = formatGuess(words || []) + formatGuess(names || []);
    const guess = wordGuess.toUpperCase() + authorGuess.toUpperCase();

    if (guess === answer) {
      gameOver = true;

      gameBoardEl.classList.add('invisible');

      window.setTimeout(() => {
        gameOverEl.classList.remove('invisible');
      }, 500);
    }
  }

  $: checkForWin(wordsValue, authorValue);
</script>

<main>
  <div class="game" bind:this={gameBoardEl}>
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
  </div>

  {#if (gameOver)}
    <div class="winMessage invisible" bind:this={gameOverEl}>
      <p>{text}</p>
      <p>&nbsp;- {author}</p>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 40px auto;
    position: relative;
  }

  .game {
    transition: opacity 1s ease-in;
  }

  .winMessage {
    opacity: 1;
    transition: opacity 1s ease-out;

    position: absolute;
    top: 60px;

    font-size: 32px;
    font-family: cursive;
  }

  .invisible {
    opacity: 0;
  }
</style>

<script>
  export let quote;

  const {author, text} = quote;

  function parseIntoWordsAndLetters(string) {
    const words = string.split(' ');
    const wordsAndLetters = words.map((word) => word.split(''));

    return wordsAndLetters;
  }

  function isLetter(character) {
    return /\p{L}/u.test(character)
  }

  const words = parseIntoWordsAndLetters(text);
  const names = parseIntoWordsAndLetters(author);
</script>

<main>
  {#each words as word}
    <span class="word">
      {#each word as character}
        {#if isLetter(character)}
          <button>{character}</button>
        {:else}
          {character}
        {/if}
      {/each}
    </span>
  {/each}
</main>

<style>
  .word {
    padding: 10px 5px;
  }
</style>

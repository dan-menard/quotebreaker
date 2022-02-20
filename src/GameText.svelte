<script>
  export let text;

  function isLetter(character) {
    return /\p{L}/u.test(character)
  }
</script>

<div class="text">
  {#each text as word}
    <div class="word">
      {#each word as character}
        <div class="character">
          {#if isLetter(character)}
            <button>{character}</button>
            <input type="text" maxlength="1" />
          {:else}
            <span>{character}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .text {
    display: flex;
    flex-wrap: wrap;
    padding: 1rem 0;
  }

  .word {
    display: flex;
    padding: 0 0.5rem;
  }

  .character {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
  }

  .character * {
    display: block;
    width: 1.5rem;
  }

  button {
    padding: 0;
    border: none;
    background: none;

    font-size: 24px;
    font-family: fixed;
  }

  input {
    padding: 0;
    border: 0;
  }
</style>

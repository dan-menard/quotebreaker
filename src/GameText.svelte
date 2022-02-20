<script>
  export let text;

  function isLetter(character) {
    return /\p{L}/u.test(character)
  }
</script>

<div>
  {#each text as word}
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
</div>

<style>
  .word {
    padding: 10px 5px;
  }
</style>

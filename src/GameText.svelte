<script>
  import isLetter from './util/isLetter.js';

  export let text;
  export let key;
  export let value;
  export let activeLetter;
  export let guessedLetters;

  let el;

  function highlightLetter({target}) {
    activeLetter = target.textContent;

    target.nextElementSibling.disabled = false;
    target.nextElementSibling.focus();
  }

  function guessAdded({target}) {
    guessedLetters[activeLetter] = target.value;
    target.disabled = true;

    activeLetter = null;

    window.setTimeout(updateValue, 0)
  }

  function checkForEnter(typeEvent) {
    if (typeEvent.key === "Enter") {
      typeEvent.target.blur();
    }
  }

  function updateValue() {
    const allInputs = Array.from(el.querySelectorAll('input'));

    value = allInputs.reduce((accumulator, input) => {
      return accumulator + input.value;
    }, '');
  }
</script>

<div class="text" bind:this={el}>
  {#each text as word}
    <div class="word">
      {#each word as character}
        {#if isLetter(character)}
          <div class="letter{key[character] === activeLetter ? ' active' : ''}">
            <button on:click={highlightLetter}>{key[character]}</button>
            <input
              type="text"
              maxlength="1"
              disabled="true"
              on:blur={guessAdded}
              on:keyup={checkForEnter}
              value={guessedLetters[key[character]] || ''}
            />
          </div>
        {:else}
          <div class="punctuation">{character}</div>
        {/if}
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

  .letter.active  button {
    color: #f0f;
  }

  .letter * {
    display: block;
    width: 1.5rem;
  }

  button {
    padding: 0;
    border: none;
    background: none;
  }

  input {
    padding: 0;
    border: 0;
    text-transform: uppercase;
    text-indent: 3px;
  }

  input, button, .punctuation {
    font-size: 24px;
    font-family: fixed;
  }

  input, input[disabled] {
    color: #3399AA;
  }
</style>

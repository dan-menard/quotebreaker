const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

function validate(key) {
  const correctLetters = ALPHABET.filter((letter) => {
    return key[letter] === letter;
  });

  return !Boolean(correctLetters.length);
}

export default function generateKey() {
  const letters = ALPHABET.slice();

  // Fisher-Yates shuffle:
  // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  for (let i=0; i<26; i++) {
    const j = Math.floor(Math.random() * 26);

    const temp = letters[i];
    letters[i] = letters[j];
    letters[j] = temp;
  }

  const key = ALPHABET.reduce((accumulator, letter) => {
    accumulator[letter] = letters.pop();
    return accumulator;
  }, {});

  if (validate(key)) {
    return key;
  } else {
    return generateKey();
  }
}

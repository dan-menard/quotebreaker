export default function generateKey() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  const scrambled = letters.slice();

  // Fisher-Yates shuffle:
  // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  for (let i=0; i<26; i++) {
    const j = Math.floor(Math.random() * 26);

    const temp = scrambled[i];
    scrambled[i] = scrambled[j];
    scrambled[j] = temp;
  }

  return letters.reduce((accumulator, letter) => {
    accumulator[letter] = scrambled.pop();
    return accumulator;
  }, {});
}

export default function isLetter(character) {
  return /\p{L}/u.test(character)
}

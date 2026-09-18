export const MAX_GUESSES = 3
export const MIN_NUMBER = 1
export const MAX_NUMBER = 100

// Points awarded based on how few guesses were used
export function pointsForGuesses(guessesUsed, found) {
  if (!found) return 0
  if (guessesUsed === 1) return 100
  if (guessesUsed === 2) return 60
  if (guessesUsed === 3) return 30
  return 0
}

// Compare a guess against the secret number
export function evaluateGuess(guess, secret) {
  if (guess === secret) return 'correct'
  if (guess < secret) return 'higher'
  return 'lower'
}
export const MAX_GUESSES = 3
export const MIN_NUMBER = 1
export const MAX_NUMBER = 100
export const TOTAL_ROUNDS = 15

export function pointsForGuesses(guessesUsed, found) {
  if (!found) return 0
  if (guessesUsed === 1) return 3
  if (guessesUsed === 2) return 2
  if (guessesUsed === 3) return 1
  return 0
}

export function evaluateGuess(guess, secret) {
  if (guess === secret) return 'correct'
  if (guess < secret) return 'higher'
  return 'lower'
}
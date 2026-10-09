export function getRandomTarget() {
    // Target between 5 and 25 (both players pick 1-15)
    return Math.floor(Math.random() * 21) + 5 // 5 to 25
  }
  
  export function getRandomTargets(count) {
    const targets = []
    for (let i = 0; i < count; i++) {
      targets.push(getRandomTarget())
    }
    return targets
  }
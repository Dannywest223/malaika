export const TRUTHS_PROMPTS = [
    'A weird talent I have...',
    'Something embarrassing that happened to me...',
    'A food I pretend to like but actually hate...',
    'Something I have never told anyone...',
    'A place I have always wanted to visit...',
    'My worst habit...',
    'A movie I have seen 10+ times...',
    'Something I am weirdly good at...',
    'The last time I cried...',
    'Something I regret...',
    'A childhood memory I will never forget...',
    'Something on my bucket list...',
    'A song that always makes me cry...',
    'A food I could eat every day...',
    'Something I am afraid of...',
    'A hobby I want to start...',
    'Something I would do if I won the lottery...',
    'A weird dream I have had...',
    'A bad habit I want to break...',
    'Something I am proud of...',
    'A place I feel most at peace...',
    'A moment that changed me...',
    'Something I do when I am alone...',
    'A thing I have never done but want to...',
    'Something that always makes me laugh...',
    'A lie I told as a kid...',
    'A talent I wish I had...',
    'Something I am bad at...',
    'A promise I have kept...',
    'A promise I have broken...',
    'Something I have never eaten...',
    'A place I have been that surprised me...',
    'A job I would never do...',
    'A gift I will never forget...',
    'A person who inspires me...',
    'A thing I own that I would never sell...',
    'A moment I wish I could relive...',
    'A thing I would change about my past...',
    'A book that changed my mind...',
    'A pet I have loved...',
    'Something I have pretended to understand...',
    'A time I laughed so hard I cried...',
    'A time I was scared but did it anyway...',
    'A thing I have bought that I regret...',
    'A thing I have bought that I love...',
    'Something I would tell my younger self...',
    'A weird food combination I like...',
    'A thing I always keep in my bag...',
    'Something I am secretly proud of...',
    'A moment I felt truly loved...',
  ]
  
  export function getRandomPrompts(count = 3) {
    const shuffled = [...TRUTHS_PROMPTS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
  
  export function shuffleArray(arr) {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
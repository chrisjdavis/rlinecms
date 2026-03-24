import { Filter } from 'bad-words'

class CustomFilter extends Filter {
  constructor() {
    super()
    // Add custom words to the blacklist
    this.addWords(
      'admin',
      'administrator',
      'mod',
      'moderator',
      'support'
    )
    // Remove any false positives from the blacklist
    this.removeWords(
      'hello',
      'class',
      'push'
    )
  }
}

export const profanityFilter = new CustomFilter() 
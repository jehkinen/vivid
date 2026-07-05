export type LoginQuote = {
  text: string
  author: string
}

export type MarginBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'tagline'; text: string }
  | { kind: 'quote'; index: number }
  | { kind: 'fragment'; text: string }
  | { kind: 'whisper'; text: string }
  | { kind: 'list'; lines: string[] }

export const LOGIN_QUOTES: LoginQuote[] = [
  {
    text: 'We write to taste life twice, in the moment and in retrospect.',
    author: 'Anaïs Nin',
  },
  {
    text: 'Memory is the diary we all carry about with us.',
    author: 'Oscar Wilde',
  },
  {
    text: 'Fill your paper with the breathings of your heart.',
    author: 'William Wordsworth',
  },
  {
    text: 'Every man\'s memory is his private literature.',
    author: 'Aldous Huxley',
  },
  {
    text: 'What matters is not what happens to you but what you remember and how you remember it.',
    author: 'Gabriel García Márquez',
  },
  {
    text: 'The pages are still blank, but there is a miraculous feeling of the words being there, written in invisible ink.',
    author: 'Cynthia Ozick',
  },
  {
    text: 'The life of every man is a diary in which he means to write one story, and writes another.',
    author: 'J. M. Barrie',
  },
  {
    text: 'Stories are memory articulated.',
    author: 'Unknown',
  },
  {
    text: 'A written journal preserves what time would gladly erase.',
    author: 'Unknown',
  },
  {
    text: 'In notebooks we hoard the weather of the soul.',
    author: 'Unknown',
  },
]

export const LEFT_MARGIN_BLOCKS: MarginBlock[] = [
  { kind: 'heading', text: 'HERE BE MEMORIES' },
  { kind: 'tagline', text: 'pages remember what the mind lets go' },
  { kind: 'quote', index: 0 },
  { kind: 'fragment', text: '記 · 憶 · 頁 · 章' },
  { kind: 'quote', index: 2 },
  { kind: 'whisper', text: 'marginalia in the margin of a life' },
  { kind: 'quote', index: 4 },
  { kind: 'list', lines: ['✦ diary entries', '✦ letters unsent', '✦ notes in the dark'] },
]

export const RIGHT_MARGIN_BLOCKS: MarginBlock[] = [
  { kind: 'heading', text: 'COMMONPLACE BOOK' },
  { kind: 'tagline', text: 'every story begins as a scribble' },
  { kind: 'quote', index: 1 },
  { kind: 'fragment', text: 'ink dries · memory stays' },
  { kind: 'quote', index: 3 },
  { kind: 'whisper', text: 'the past lives in what we wrote down' },
  { kind: 'quote', index: 5 },
  { kind: 'list', lines: ['✦ folded pages', '✦ dated notebooks', '✦ a name in pencil'] },
]

export const NARROW_ABOVE_BLOCKS: MarginBlock[] = [
  { kind: 'tagline', text: 'HERE BE MEMORIES' },
  { kind: 'quote', index: 0 },
  { kind: 'quote', index: 2 },
]

export const NARROW_BELOW_BLOCKS: MarginBlock[] = [
  { kind: 'fragment', text: '記 · 憶 · ink · paper' },
  { kind: 'quote', index: 1 },
  { kind: 'quote', index: 4 },
  { kind: 'whisper', text: 'the past lives in what we wrote down' },
  { kind: 'quote', index: 7 },
  { kind: 'list', lines: ['✦ diary entries', '✦ dated notebooks', '✦ letters unsent'] },
]

export const BOTTOM_LEFT_BLOCKS: MarginBlock[] = [
  { kind: 'quote', index: 6 },
  { kind: 'whisper', text: 'a name written in pencil' },
  { kind: 'quote', index: 8 },
  { kind: 'list', lines: ['✦ torn corners', '✦ coffee stains', '✦ pressed flowers'] },
]

export const BOTTOM_RIGHT_BLOCKS: MarginBlock[] = [
  { kind: 'quote', index: 7 },
  { kind: 'fragment', text: 'pages turn · chapters close' },
  { kind: 'quote', index: 9 },
  { kind: 'whisper', text: 'in notebooks we hoard the weather of the soul' },
]

export const BOTTOM_CENTER_BLOCKS: MarginBlock[] = [
  { kind: 'tagline', text: 'Ink fades. Paper yellows. What we wrote remains.' },
  { kind: 'quote', index: 5 },
  { kind: 'fragment', text: '記 · 憶 · diary · journal · commonplace book' },
  { kind: 'whisper', text: 'every story begins as a note in the margin' },
]

export const TUNNEL_PHRASES = [
  'pages turn · ink dries · memory stays',
  'diary · journal · commonplace book',
  '記 · 憶 · 頁 · 章',
  'marginalia in the margin of a life',
  'every story begins as a note',
  'letters kept in drawers for decades',
  'the past lives in what we wrote down',
]

export const DRIFT_GLYPHS = '✎✐◈◇◆▪▫▸▹▴┄┈記憶頁章'.split('')

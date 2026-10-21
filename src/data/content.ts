export interface Fact {
  readonly label: string
  readonly value: string
}

export interface Project {
  readonly name: string
  readonly summary: string
  readonly liveUrl: string
  readonly repoUrl: string
  readonly facts: readonly Fact[]
}

export const profile = {
  name: 'Jakob',
  role: 'Software developer',
  githubUrl: 'https://github.com/hpmine42',
  githubLabel: 'github.com/hpmine42',
} as const

export const enough: Project = {
  name: 'enough.',
  summary: 'A minimalist private 1:1 messenger focused on privacy, security and simplicity.',
  liveUrl: 'https://hpmine42.github.io/enough/',
  repoUrl: 'https://github.com/hpmine42/enough',
  facts: [
    { label: 'Encryption', value: 'End-to-end, Signal Protocol (PQXDH and Double Ratchet)' },
    { label: 'Built with', value: 'React, TypeScript, Vite, Supabase' },
  ],
}

/*
  Verified against https://github.com/hpmine42/Aiko (README, package.json and
  the repository's website field). Aiko is a rule-based offline chat, not a
  language model.
*/
export const aiko: Project = {
  name: 'Aiko',
  summary: 'A rule-based chat assistant that runs entirely on your device. No language model, no internet.',
  liveUrl: 'https://hpmine42.github.io/Aiko/',
  repoUrl: 'https://github.com/hpmine42/Aiko',
  facts: [
    { label: 'Answers', value: 'From your own rules or built-in local tools' },
    { label: 'Data', value: 'Stays in the browser' },
    { label: 'Built with', value: 'React, TypeScript, Vite' },
  ],
}

export interface NavItem {
  readonly id: string
  readonly label: string
}

export const sections: readonly NavItem[] = [
  { id: 'top', label: 'Jakob' },
  { id: 'enough', label: 'enough.' },
  { id: 'aiko', label: 'Aiko' },
]

export interface ResolverSample {
  readonly input: string
  readonly stage: number
  readonly result: string
}

/* Order and wording follow the "How an answer is made" section of the Aiko README. */
export const resolverStages: readonly string[] = [
  'Slash command',
  'Follow-up',
  'Priority or exact rule',
  'Local tools',
  'Rule',
  'Offline calculator',
  'Meta answers',
  'Your notes',
  'Fallback',
]

const commandSample: ResolverSample = { input: '/timer 5 Minuten', stage: 1, result: 'Starts a real countdown.' }
const followUpSample: ResolverSample = { input: 'warum?', stage: 2, result: 'Refers back to the previous answer.' }
const calculatorSample: ResolverSample = { input: '23 × 17', stage: 6, result: '391' }
const fallbackSample: ResolverSample = {
  input: 'blorp',
  stage: 9,
  result: 'Says it has no answer instead of making one up.',
}

export const resolverDefault: ResolverSample = calculatorSample

export const resolverSamples: readonly ResolverSample[] = [
  commandSample,
  followUpSample,
  calculatorSample,
  fallbackSample,
]

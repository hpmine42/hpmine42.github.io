export interface Fact {
  readonly label: string
  readonly value: string
}

export interface Highlight {
  readonly title: string
  readonly text: string
}

export interface Project {
  readonly name: string
  readonly kicker: string
  readonly summary: string
  readonly highlights: readonly Highlight[]
  readonly liveUrl: string
  readonly repoUrl: string
  readonly facts: readonly Fact[]
}

export const profile = {
  name: 'hpmine42',
  role: 'Software developer',
  githubUrl: 'https://github.com/hpmine42',
  githubLabel: 'github.com/hpmine42',
} as const

export const enough: Project = {
  name: 'enough.',
  kicker: 'Selected project',
  summary: 'A minimalist private 1:1 messenger focused on privacy, security and simplicity.',
  highlights: [
    {
      title: 'Private by design',
      text: 'Messages are end-to-end encrypted with the Signal Protocol, so nobody in between can read along.',
    },
    {
      title: 'Simple on purpose',
      text: 'One conversation, one screen. What is not there cannot distract you, and it cannot break either.',
    },
    {
      title: 'Open to be checked',
      text: 'React, TypeScript, Vite and Supabase, and the whole thing is open source. Read every line yourself.',
    },
  ],
  liveUrl: 'https://hpmine42.github.io/enough/',
  repoUrl: 'https://github.com/hpmine42/enough',
  facts: [
    { label: 'Encryption', value: 'End-to-end, Signal Protocol (PQXDH and Double Ratchet)' },
    { label: 'Built with', value: 'React, TypeScript, Vite, Supabase' },
  ],
}

/* The note under enough.: this page shows one selected project, the rest
   of the work is on GitHub. */
export const elsewhere = {
  eyebrow: 'Beyond this page',
  title: 'The rest of my work lives on GitHub',
  text: 'enough. is the project I put the most into, so it is the only one shown here. Smaller tools, experiments and older ideas sit next to its source code.',
  label: 'Browse all repositories',
  url: 'https://github.com/hpmine42?tab=repositories',
} as const

export interface RepoCard {
  readonly label: string
  readonly repo: string
  readonly url: string
}

/* Smaller projects, shown as a short strip next to the GitHub note. Static on
   purpose: the page has no backend and no analytics. */
export const moreRepos: readonly RepoCard[] = [
  {
    label: 'JSON Opener',
    repo: 'json-opener-on-android-',
    url: 'https://github.com/hpmine42/json-opener-on-android-',
  },
  {
    label: 'Stopwatch',
    repo: 'Stopwatch',
    url: 'https://github.com/hpmine42/Stopwatch',
  },
]

export interface NavItem {
  readonly id: string
  readonly label: string
}

export const sections: readonly NavItem[] = [
  { id: 'top', label: 'hpmine42' },
  { id: 'enough', label: 'enough.' },
]

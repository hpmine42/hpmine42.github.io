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
  name: 'hpmine42',
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

export interface NavItem {
  readonly id: string
  readonly label: string
}

export const sections: readonly NavItem[] = [
  { id: 'top', label: 'hpmine42' },
  { id: 'enough', label: 'enough.' },
]

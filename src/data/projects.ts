/*
  Project content. Every statement here is taken from the public repositories:
  https://github.com/hpmine42/enough (repository description)
  https://github.com/hpmine42/Aiko   (README)
*/

export interface Fact {
  readonly label: string
  readonly value: string
}

export const links = {
  github: 'https://github.com/hpmine42',
} as const

export interface EnoughProject {
  readonly live: string
  readonly source: string
  readonly facts: readonly Fact[]
}

export const enough: EnoughProject = {
  live: 'https://hpmine42.github.io/enough/',
  source: 'https://github.com/hpmine42/enough',
  facts: [
    { label: 'Scope', value: '1:1 conversations only' },
    { label: 'Encryption', value: 'End-to-end, based on the Signal Protocol' },
    { label: 'Recovery', value: 'Secure, built in' },
    { label: 'Without', value: 'Ads, tracking, push notifications' },
    { label: 'Stack', value: 'React · TypeScript · Vite · Supabase' },
  ],
}

export type StageId =
  | 'command'
  | 'followup'
  | 'priority'
  | 'tools'
  | 'rule'
  | 'calculator'
  | 'meta'
  | 'knowledge'
  | 'fallback'

export interface Stage {
  readonly id: StageId
  readonly name: string
  readonly note: string
}

export interface Sample {
  readonly input: string
  readonly stage: StageId
}

export interface AikoProject {
  readonly live: string
  readonly source: string
  readonly facts: readonly Fact[]
  /** Evaluation order of the engine, as documented in the Aiko README. */
  readonly stages: readonly Stage[]
  /** Example inputs taken from the README, routed to the stage the README names for them. */
  readonly samples: readonly Sample[]
}

export const aiko: AikoProject = {
  live: 'https://hpmine42.github.io/Aiko/',
  source: 'https://github.com/hpmine42/Aiko',
  facts: [
    { label: 'Runs', value: 'On the device. Offline.' },
    { label: 'Answers', value: 'From rules and local tools. No language model.' },
    { label: 'Data', value: 'Stays in the browser' },
    { label: 'Stack', value: 'React · TypeScript · Vite · PWA' },
  ],
  stages: [
    { id: 'command', name: 'Slash command', note: '/timer' },
    { id: 'followup', name: 'Follow-up', note: 'refers back' },
    { id: 'priority', name: 'Priority or exact rule', note: 'wins at once' },
    { id: 'tools', name: 'Local tools', note: 'units, dates, QR' },
    { id: 'rule', name: 'Keyword rule', note: 'typo-tolerant' },
    { id: 'calculator', name: 'Offline calculator', note: 'expressions' },
    { id: 'meta', name: 'Meta answers', note: 'about itself' },
    { id: 'knowledge', name: 'Knowledge base', note: 'your notes' },
    { id: 'fallback', name: 'Fallback', note: 'says so' },
  ],
  samples: [
    { input: '/timer 5 Minuten', stage: 'command' },
    { input: 'warum?', stage: 'followup' },
    { input: '4,7 GB bei 50 Mbit/s', stage: 'tools' },
    { input: '23 × 17', stage: 'calculator' },
  ],
}

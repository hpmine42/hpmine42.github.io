import { describe, expect, it } from 'vitest'
import { elsewhere, enough, moreRepos, profile, sections } from '../src/data/content'

describe('content', () => {
  it('marks enough. as the selected project', () => {
    expect(enough.kicker).toBe('Selected project')
    expect(enough.highlights.length).toBe(3)
    expect(enough.highlights.every((item) => item.title.length > 0 && item.text.length > 0)).toBe(
      true,
    )
  })

  it('keeps the navigation short and pointing at real ids', () => {
    expect(sections.map((item) => item.id)).toEqual(['top', 'enough'])
  })

  it('sends the rest of the work to GitHub', () => {
    expect(elsewhere.url.startsWith('https://github.com/hpmine42')).toBe(true)
    expect(profile.githubUrl).toBe('https://github.com/hpmine42')
  })

  it('shows a handful of smaller repositories with a live or repo destination', () => {
    expect(moreRepos.length).toBeGreaterThan(2)
    expect(moreRepos.length).toBeLessThanOrEqual(4)
    for (const repo of moreRepos) {
      expect(repo.url).toMatch(/^https:\/\/github\.com\/hpmine42\//)
      if (repo.liveUrl) expect(repo.liveUrl).toMatch(/^https:\/\//)
    }
  })
})

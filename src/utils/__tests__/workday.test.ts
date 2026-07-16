import { describe, expect, it } from 'vitest'
import { hasWorkdayIntegration } from '../workday'

describe('hasWorkdayIntegration', () => {
    it.each(['https://bridgestonefms.atlassian.net', 'bridgestonefms.atlassian.net'])('enables Workday for %s', (domain) => {
        expect(hasWorkdayIntegration(domain)).toBe(true)
    })

    it.each(['https://ttt-sp.com', 'https://bridgestonefms.atlassian.net.example.com', 'https://example.atlassian.net', ''])(
        'does not enable Workday for %s',
        (domain) => {
            expect(hasWorkdayIntegration(domain)).toBe(false)
        }
    )
})

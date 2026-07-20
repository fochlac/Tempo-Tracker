import { describe, expect, it } from 'vitest'
import { filterDuplicateWorklogs, hasWorkdayIntegration } from '../workday'

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

describe('filterDuplicateWorklogs', () => {
    const duplicateStart = new Date(2026, 5, 30, 0).getTime()
    const duplicateEnd = new Date(2026, 5, 30, 8).getTime()

    it('removes exact duplicate intervals for the Workday integration', () => {
        const worklogs = [
            { id: 'absence', start: duplicateStart, end: duplicateEnd },
            { id: 'worklog', start: duplicateStart, end: duplicateEnd },
            { id: 'other', start: duplicateEnd, end: duplicateEnd + 60 * 60 * 1000 }
        ] as Worklog[]

        expect(filterDuplicateWorklogs(worklogs, 'https://bridgestonefms.atlassian.net')).toEqual([worklogs[0], worklogs[2]])
    })

    it('keeps duplicate intervals for other Jira instances', () => {
        const worklogs = [
            { id: 'first', start: duplicateStart, end: duplicateEnd },
            { id: 'second', start: duplicateStart, end: duplicateEnd }
        ] as Worklog[]

        expect(filterDuplicateWorklogs(worklogs, 'https://example.atlassian.net')).toEqual(worklogs)
    })
})

import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDispatch, useSelector } from '../../utils/atom'

import { useInsertWorklog } from '../useInsertWorklog'
import { useJqlQueryResults } from '../useJqlQueryResult'
import { useOptions } from '../useOptions'
import { usePrevious } from '../usePrevious'

// Mock dependencies
vi.mock('../../utils/atom', () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn()
}))

vi.mock('../useOptions', () => ({
    useOptions: vi.fn()
}))

vi.mock('../useJqlQueryResult', () => ({
    useJqlQueryResults: vi.fn()
}))

vi.mock('../usePrevious', () => ({
    usePrevious: vi.fn()
}))

vi.mock('uuid', () => ({
    v4: vi.fn(() => 'test-uuid-123')
}))

describe('useInsertWorklog', () => {
    const mockDispatch = vi.fn()
    const mockUseDispatch = vi.mocked(useDispatch)
    const mockUseSelector = vi.mocked(useSelector)
    const mockUseOptions = vi.mocked(useOptions)
    const mockUseJqlQueryResults = vi.mocked(useJqlQueryResults)
    const mockUsePrevious = vi.mocked(usePrevious)

    const mockLocalIssue: LocalIssue = {
        id: '1',
        key: 'TEST-1',
        name: 'Test Issue',
        alias: 'Test',
        color: '#ff0000'
    }

    const mockRemoteIssue: LocalIssue = {
        id: '2',
        key: 'TEST-2',
        name: 'Remote Issue',
        alias: 'Remote',
        color: '#00ff00'
    }

    const mockOptions = {
        issues: {
            'TEST-1': mockLocalIssue
        },
        issueOrder: ['TEST-1'],
        domain: 'test.atlassian.net',
        locale: 'en',
        user: 'testuser',
        useJqlQuery: true,
        jqlQuery: 'project = TEST',
        showComments: true,
        autosync: true,
        forceSync: false,
        forceFetch: false,
        theme: 'DEFAULT' as keyof THEMES,
        customTheme: {
            background: '#ffffff',
            font: '#000000',
            link: '#0066cc',
            destructive: '#ff0000',
            diagramm: '#cccccc',
            diagrammGreen: '#00ff00'
        },
        token: 'test-token',
        authenticationType: 'TOKEN' as keyof AUTHENTICATION_TYPE,
        disableWorkdaySync: false,
        ttToken: '',
        email: 'test@example.com',
        days: [1, 2, 3, 4, 5],
        instance: 'cloud' as const,
        offlineMode: false
    }

    const mockEditIssue = {
        issue: null
    }

    beforeEach(() => {
        vi.clearAllMocks()

        mockUseDispatch.mockReturnValue(mockDispatch)
        mockUseSelector.mockReturnValue(mockEditIssue)
        mockUseOptions.mockReturnValue({
            data: mockOptions,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })
        mockUseJqlQueryResults.mockReturnValue([mockRemoteIssue])
        mockUsePrevious.mockReturnValue(null)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return initial state with no newWorklog', () => {
        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.newWorklog).toBeNull()
        expect(typeof result.current.createNewWorklog).toBe('function')
    })

    it('should create new worklog when createNewWorklog is called', async () => {
        const { result } = renderHook(() => useInsertWorklog())

        await act(async () => {
            await result.current.createNewWorklog()
        })

        expect(mockDispatch).toHaveBeenCalledWith('setEditIssue', { issue: 'test-uuid-123' })
        expect(result.current.newWorklog).toEqual({
            issue: mockLocalIssue,
            start: expect.any(Number),
            end: expect.any(Number),
            synced: false,
            tempId: 'test-uuid-123'
        })
    })

    it('should use remote issue when no local issues available', async () => {
        const optionsWithoutLocalIssues = {
            ...mockOptions,
            issues: {}
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithoutLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useInsertWorklog())

        await act(async () => {
            await result.current.createNewWorklog()
        })

        expect(result.current.newWorklog.issue).toEqual(mockRemoteIssue)
    })

    it('should return undefined createNewWorklog when no default issue available', () => {
        const optionsWithoutIssues = {
            ...mockOptions,
            issues: {}
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithoutIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })
        mockUseJqlQueryResults.mockReturnValue([])

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.createNewWorklog).toBeUndefined()
    })

    it('should handle editIssue with different issue', () => {
        const mockEditIssueWithDifferentIssue = {
            issue: 'different-uuid'
        }
        mockUseSelector.mockReturnValue(mockEditIssueWithDifferentIssue)
        mockUsePrevious.mockReturnValue('test-uuid-123' as unknown as undefined)

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.newWorklog).toBeNull()
        expect(typeof result.current.createNewWorklog).toBe('function')
    })

    it('should handle editIssue with same issue as previous', () => {
        const mockEditIssueWithSameIssue = {
            issue: 'test-uuid-123'
        }
        mockUseSelector.mockReturnValue(mockEditIssueWithSameIssue)
        mockUsePrevious.mockReturnValue('test-uuid-123' as unknown as undefined)

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.newWorklog).toBeNull()
        expect(typeof result.current.createNewWorklog).toBe('function')
    })

    it('should handle multiple remote issues and use the first one', async () => {
        const multipleRemoteIssues = [
            mockRemoteIssue,
            {
                id: '3',
                key: 'TEST-3',
                name: 'Another Remote Issue',
                alias: 'Another',
                color: '#0000ff'
            }
        ]
        mockUseJqlQueryResults.mockReturnValue(multipleRemoteIssues)

        const optionsWithoutLocalIssues = {
            ...mockOptions,
            issues: {}
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithoutLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useInsertWorklog())

        await act(async () => {
            await result.current.createNewWorklog()
        })

        expect(result.current.newWorklog.issue).toEqual(mockRemoteIssue)
    })

    it('should handle empty remote issues array', () => {
        mockUseJqlQueryResults.mockReturnValue([])

        const optionsWithoutLocalIssues = {
            ...mockOptions,
            issues: {}
        }
        mockUseOptions.mockReturnValue({
            data: optionsWithoutLocalIssues,
            actions: {
                set: vi.fn(),
                merge: vi.fn(),
                reset: vi.fn()
            }
        })

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.createNewWorklog).toBeUndefined()
    })

    it('should handle null editIssue', () => {
        mockUseSelector.mockReturnValue({ issue: null })

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.newWorklog).toBeNull()
        expect(typeof result.current.createNewWorklog).toBe('function')
    })

    it('should handle undefined editIssue', () => {
        mockUseSelector.mockReturnValue({ issue: undefined })

        const { result } = renderHook(() => useInsertWorklog())

        expect(result.current.newWorklog).toBeNull()
        expect(typeof result.current.createNewWorklog).toBe('function')
    })

    it('should create worklog with correct timestamps', async () => {
        const mockDateNow = vi.spyOn(Date, 'now')
        const fixedTime = 1234567890
        mockDateNow.mockReturnValue(fixedTime)

        const { result } = renderHook(() => useInsertWorklog())

        await act(async () => {
            await result.current.createNewWorklog()
        })

        expect(result.current.newWorklog.start).toBe(fixedTime)
        expect(result.current.newWorklog.end).toBe(fixedTime)
        expect(result.current.newWorklog.synced).toBe(false)
        expect(result.current.newWorklog.tempId).toBe('test-uuid-123')

        mockDateNow.mockRestore()
    })

    it('should handle dispatch errors gracefully', async () => {
        mockDispatch.mockRejectedValue(new Error('Dispatch error'))

        const { result } = renderHook(() => useInsertWorklog())

        await act(async () => {
            try {
                await result.current.createNewWorklog()
                expect(false).toBe(true)
            } catch (error) {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error).toBeInstanceOf(Error)
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.message).toBe('Dispatch error')
            }
        })

        expect(mockDispatch).toHaveBeenCalledWith('setEditIssue', { issue: 'test-uuid-123' })
    })
})

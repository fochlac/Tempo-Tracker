import { act, renderHook } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchSelf, hasPermissions } from '../../utils/api'

import { AUTH_TYPES } from '../../constants/constants'
import { getOptions } from '../../utils/options'
import { useOptions } from '../useOptions'
import { useSelf } from '../useSelf'

// Mock dependencies
vi.mock('../../utils/api', () => ({
    fetchSelf: vi.fn(),
    hasPermissions: vi.fn()
}))

vi.mock('../useOptions', () => ({
    useOptions: vi.fn()
}))

describe('useSelf', () => {
    const mockFetchSelf = vi.mocked(fetchSelf)
    const mockHasPermissions = vi.mocked(hasPermissions)
    const mockUseOptions = vi.mocked(useOptions)

    const defaultOptions = getOptions({
        token: 'test-token',
        domain: 'test.atlassian.net',
        user: 'testuser',
        authenticationType: AUTH_TYPES.TOKEN,
        instance: 'cloud',
        offlineMode: false
    })

    const mockActions = {
        merge: vi.fn(),
        set: vi.fn(),
        reset: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()

        mockUseOptions.mockReturnValue({
            data: defaultOptions,
            actions: mockActions
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should return initial state', () => {
        const { result } = renderHook(() => useSelf())

        expect(result.current.name).toBeNull()
        expect(result.current.error).toBeNull()
        expect(typeof result.current.refetch).toBe('function')
    })

    it('should handle offline mode', async () => {
        mockUseOptions.mockReturnValue({
            data: { ...defaultOptions, offlineMode: true },
            actions: mockActions
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.name).toBe('Offline User')
        expect(result.current.error).toBeNull()
        expect(mockFetchSelf).not.toHaveBeenCalled()
        expect(mockHasPermissions).not.toHaveBeenCalled()
    })

    it('should handle successful authentication with token', async () => {
        mockHasPermissions.mockResolvedValue(true)
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com'
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.name).toBe('Test User')
        expect(result.current.error).toBeNull()
        expect(mockHasPermissions).toHaveBeenCalledTimes(1)
        expect(mockFetchSelf).toHaveBeenCalledWith({
            token: 'test-token',
            domain: 'test.atlassian.net'
        })
    })

    it('should handle refetch with different options', async () => {
        mockHasPermissions.mockResolvedValue(true)
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com'
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.name).toBe('Test User')

        // Refetch with different domain
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Different User',
            emailAddress: 'different@example.com'
        })

        await act(async () => {
            await result.current.refetch({ domain: 'different.atlassian.net' })
        })

        expect(result.current.name).toBe('Different User')
        expect(mockFetchSelf).toHaveBeenCalledWith({
            token: 'test-token',
            domain: 'different.atlassian.net'
        })
    })

    it('should handle missing domain and token', async () => {
        mockUseOptions.mockReturnValue({
            data: {
                ...defaultOptions,
                domain: '',
                token: ''
            },
            actions: mockActions
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.error).toBe('DEFAULT')
        expect(mockHasPermissions).not.toHaveBeenCalled()
        expect(mockFetchSelf).not.toHaveBeenCalled()
    })

    it('should handle cookie authentication with empty token', async () => {
        mockUseOptions.mockReturnValue({
            data: {
                ...defaultOptions,
                instance: 'datacenter',
                authenticationType: AUTH_TYPES.COOKIE,
                token: '',
                user: 'testuser'
            },
            actions: mockActions
        })

        mockHasPermissions.mockResolvedValue(true)
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com'
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.name).toBe('Test User')
        expect(result.current.error).toBeNull()
    })

    it('should handle successful cookie authentication', async () => {
        mockUseOptions.mockReturnValue({
            data: {
                ...defaultOptions,
                instance: 'datacenter',
                authenticationType: AUTH_TYPES.COOKIE,
                user: 'testuser'
            },
            actions: mockActions
        })

        mockHasPermissions.mockResolvedValue(true)
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Test User',
            emailAddress: 'test@example.com'
        })

        const { result } = renderHook(() => useSelf())

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0))
        })

        expect(result.current.name).toBe('Test User')
        expect(result.current.error).toBeNull()
    })

    it('should handle refetch functionality', async () => {
        const { result } = renderHook(() => useSelf())

        // Test that refetch is a function
        expect(typeof result.current.refetch).toBe('function')

        // Test refetch with options
        mockHasPermissions.mockResolvedValue(true)
        mockFetchSelf.mockResolvedValue({
            user: 'testuser',
            displayName: 'Refetch User',
            emailAddress: 'refetch@example.com'
        })

        await act(async () => {
            await result.current.refetch({ token: 'new-token' })
        })

        expect(mockFetchSelf).toHaveBeenCalledWith({
            token: 'new-token',
            domain: 'test.atlassian.net'
        })
    })
})

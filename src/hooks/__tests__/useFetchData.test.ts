import { renderHook } from '@testing-library/preact-hooks'
import { useFetchData } from '../useFetchData'

function mockFetchFunction(): Promise<string> {
    return Promise.resolve('data')
}
describe('useFetchData', () => {
    it('should set loading to true when the hook is first called', () => {
        const { result } = renderHook(() => useFetchData(mockFetchFunction))
        expect(result.current.loading).toBe(true)
    })

    it('should set data to the resolved value of the fetch function', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useFetchData(mockFetchFunction))
        await waitForNextUpdate()
        expect(result.current.data).toBe('data')
    })

    it('should set loading to false after fetch function resolves', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useFetchData(mockFetchFunction))
        await waitForNextUpdate()
        expect(result.current.loading).toBe(false)
    })

    it('should set error to the rejected value of the fetch function', async () => {
        const mockError = new Error('fetch error')
        const mockFetchWithError = jest.fn(() => Promise.reject(mockError))
        const { result, waitForNextUpdate } = renderHook(() => useFetchData(mockFetchWithError))
        await waitForNextUpdate()
        expect(result.current.error).toBe(mockError)
    })

    it('should set data to initialData when fetch function rejects', async () => {
        const mockError = new Error('fetch error')
        const mockFetchWithError = jest.fn(() => Promise.reject(mockError))
        const initialData = 'initial data'
        const { result, waitForNextUpdate } = renderHook(() => useFetchData(mockFetchWithError, initialData))
        await waitForNextUpdate()
        expect(result.current.data).toBe(initialData)
    })
})

import { renderHook, act } from '@testing-library/preact-hooks'
import { useCache } from '../useCache'
import { DB } from '../../utils/data-layer'

jest.mock('../../utils/database', () => {
    const result = { test: 'mocked data' }
    return ({
        useDatabase: jest.fn().mockImplementation(() => result)
    })
})

jest.mock('../../utils/data-layer', () => ({
    DB: { set: jest.fn(() => Promise.resolve()) }
}))

describe('useCache', () => {
    const uuid = 'test-uuid' as CACHE
    const initialData = { test: 'data' }
    const defaultCache = { data: initialData, validUntil: 0 }
    
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should return the data from the useDatabase hook', async () => {
        const { result } = renderHook(() => useCache(uuid, initialData))
        expect(result.current.cache).toEqual({ test: 'mocked data' })
    })

    it('should set the data in the cache and database when the setCache function is called', async () => {
        const { result } = renderHook(() => useCache(uuid, initialData))
        const newData = { data: { test: 'new data' }, validUntil: Date.now() }
        await act(async () => {
            await result.current.setCache(newData)
        })
        expect(DB.set).toHaveBeenCalledWith(uuid, newData)
        expect(result.current.cache).toEqual(newData)
    })

    it('should update the cached data when the updateData function is called', async () => {
        const { result } = renderHook(() => useCache(uuid, initialData))
        const updater = (originalData) => ({ ...originalData, updated: true })
        act(() => {
            result.current.updateData(updater)
        })
        expect(DB.set).toHaveBeenCalledWith(uuid, {data: { test: 'mocked data', updated: true }})
        expect(result.current.cache).toEqual({ test: 'mocked data', updated: true })
    })

    it.only('should reset the cache when the resetCache function is called', async () => {
        const { result } = renderHook(() => useCache(uuid, initialData))
        await act(async () => {
            await result.current.resetCache()
        })
        expect(DB.set).toHaveBeenCalledWith(uuid, defaultCache)
        expect(result.current.cache).toEqual(defaultCache)
    })
})

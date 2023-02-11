import { act, renderHook } from '@testing-library/preact-hooks'
import { useInsertWorklog } from '../useInsertWorklog'
import { useDispatch, useSelector } from '../../utils/atom'
import { useOptions } from '../useOptions'
jest.mock('../../utils/atom',()=> {
    const dispatch = jest.fn(() => Promise.resolve())
    return {
        useDispatch: jest.fn(() => dispatch),
        useSelector: jest.fn()
    }
})
jest.mock('../useOptions',()=>({
    useOptions: jest.fn()
}))
describe('useInsertWorklog', () => {
    const mockUseSelector = useSelector as jest.MockedFunction<any>
    const mockUseOptions = useOptions as jest.MockedFunction<any>
    const mockEditIssue = {
        issue: '123',
        start: Date.now(),
        end: Date.now(),
        synced: false,
        tempId: 'abc'
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSelector.mockReturnValue(mockEditIssue)
        const data = { issues: { '123': { id: '123', name: 'Test Issue', key: 'TE-123', alias: 'testissue' } } }
        mockUseOptions.mockReturnValue({ data })
    })

    it('should create a new temporary worklog when createNewWorklog is called', async () => {
        const { result } = renderHook(() => useInsertWorklog())
        await act(async () => {
            await result.current.createNewWorklog()
        })

        const mockDispatch = useDispatch()

        expect(result.current.newWorklog).toEqual({
            issue: { id: '123', name: 'Test Issue', key: 'TE-123', alias: 'testissue' },
            start: expect.any(Number),
            end: expect.any(Number),
            synced: false,
            tempId: expect.any(String)
        })
        expect(mockDispatch).toHaveBeenCalledWith('setEditIssue', { issue: result.current.newWorklog.tempId })
    })

    it('should clear the newWorklog state when the user navigates away from the new worklog', () => {
        const { result, rerender } = renderHook(() => useInsertWorklog())
        mockUseSelector.mockReturnValue({issue: '456'})
        rerender()

        expect(result.current.newWorklog).toBeNull()
    })
})
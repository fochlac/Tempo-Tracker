import { useDatabase, useDatabaseUpdate } from "../utils/database"
const defaultOptions = {
    user: '',
    token: '',
    issues: [],
    autosync: false,
    domain: ''
}

export function useOptions() {
    const options: Options = useDatabase<'options'>('options') || { ...defaultOptions }
    const updateOptions = useDatabaseUpdate('options')
    
    return {
        data: options,
        actions: {
            async set(newOptions) {
                await updateOptions(newOptions)
            },
            async merge(newOptions) {
                const update = {
                    ...options,
                    ...newOptions
                }
                await updateOptions(update)
            },
            async reset() {
                const update = { ...defaultOptions }
                await updateOptions(update)
            }
        }
    }
}

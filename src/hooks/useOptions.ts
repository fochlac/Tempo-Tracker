import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { getOptions } from "../utils/options"

export function useOptions() {
    const options: Options = useDatabase<'options'>('options') || getOptions({})
    const updateOptions = useDatabaseUpdate('options')
    
    return {
        data: getOptions(options),
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
                const update = getOptions({})
                await updateOptions(update)
            }
        }
    }
}

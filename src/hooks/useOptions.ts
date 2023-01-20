import { DB_KEYS } from "../constants/constants"
import { useDatabase, useDatabaseUpdate } from "../utils/database"
import { getOptions } from "../utils/options"

export function useOptions() {
    const options: Options = useDatabase<'options'>('options') || getOptions({})
    const updateOptions = useDatabaseUpdate(DB_KEYS.OPTIONS)
    
    return {
        data: getOptions(options),
        actions: {
            async set(newOptions) {
                await updateOptions(newOptions)
            },
            async merge(newOptions: Partial<Options>) {
                await updateOptions((options) => getOptions({
                    ...(options || {}),
                    ...newOptions
                }))
            },
            async reset() {
                const update = getOptions({})
                await updateOptions(update)
            }
        }
    }
}

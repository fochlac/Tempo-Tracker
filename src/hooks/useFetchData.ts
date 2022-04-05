import { useEffect } from "preact/hooks"
import { useSafeState } from "./useSafeState"

export function useFetchData<D> (fetchFunction: () => Promise<D>, initialData?: D):FetchResult<D> {
    const [data, setData] = useSafeState(initialData)
    const [error, setError] = useSafeState(null)
    const [loading, setLoading] = useSafeState(true)
    
    useEffect(() => {
        let isMounted = true
        setLoading(true)
        fetchFunction()
            .then((data) => {
                if (isMounted) {
                    setLoading(false)
                    setData(data)
                }
            })
            .catch(e => {
                setLoading(false)
                setError(e)
                setData(initialData)
            })

        return () => {
            isMounted = false
        }
    }, [])

    return {
        data, error, loading
    }
}
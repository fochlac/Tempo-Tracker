import { useEffect, useState } from "preact/hooks"

export function useFetchData<D> (fetchFunction: () => Promise<D>, initialData?: D):FetchResult<D> {
    const [data, setData] = useState(initialData)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    
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
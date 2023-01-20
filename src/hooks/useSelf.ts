import { useEffect } from "preact/hooks"
import { fetchSelf } from "../utils/jira"
import { useSafeState } from "./useSafeState"
import { useOptions } from "./useOptions"

let cacheInfo = {
    id: null,
    time: 0
}

export function useSelf() {
    const [error, setError] = useSafeState(null)
    const [name, setName] = useSafeState(null)
    const { data: {token, domain, user}, actions } = useOptions()

    const checkDomainToken = async (override?: Partial<Options>) => {
        const localToken = override?.token || token
        const localDomain = override?.domain || domain
        if (localDomain.length && localToken.length) {
            const id = `${localDomain}${localToken}`
            if (cacheInfo.id === id && cacheInfo.time > Date.now()) return 
            cacheInfo.id = id
            try {
                const res = await fetchSelf({ token: localToken, domain: localDomain })
                if (cacheInfo.id === id && res?.key) {
                    cacheInfo.time = Date.now() + 1000 * 60
                    setError(null)
                    setName(res.displayName)
                    if (res.key !== user) {
                        actions.merge({ user: res.key })
                    }
                    return
                }
                setError(true)
            }
            catch (e) {
                if (cacheInfo.id !== id) return
                if (e?.status === 401) {
                    setError('TOKEN')
                }
                else {
                    setError(true)
                }
            }
        }
        else {
            setError(true)
        }
    }

    useEffect(() => {
        checkDomainToken()
    }, [])

    return { name, error, refetch: (options?: Partial<Options>) => checkDomainToken(options) }
}
import { useEffect } from 'preact/hooks'
import { fetchSelf, hasPermissions } from '../utils/api'
import { useSafeState } from './useSafeState'
import { useOptions } from './useOptions'

const cacheInfo = {
    id: null,
    time: 0,
    name: null
}

export function useSelf() {
    const [error, setError] = useSafeState(null)
    const [name, setName] = useSafeState(null)
    const { data: { token, domain, user }, actions } = useOptions()

    const checkDomainToken = async (override?: Partial<Options>) => {
        const localToken = override?.token || token
        const localDomain = override?.domain || domain
        if (localDomain.length && localToken.length) {
            const id = `${localDomain}${localToken}`
            if (cacheInfo.id === id && cacheInfo.time > Date.now() && !(override && Object.values(override).length)) {
                setName(cacheInfo.name)
                return
            }
            cacheInfo.id = id
            const hasPermission = await hasPermissions()
            if (!hasPermission) {
                return setError('PERMISSION')
            }
            try {
                const res = await fetchSelf({ token: localToken, domain: localDomain })
                if (cacheInfo.id === id && res.user) {
                    cacheInfo.time = Date.now() + 1000 * 60
                    setError(null)
                    setName(res.displayName)
                    cacheInfo.name = res.displayName
                    if (res.user !== user) {
                        return actions.merge({ user: res.user })
                    }
                    return
                }
                setError('DEFAULT')
            }
            catch (e) {
                if (cacheInfo.id !== id) return
                if (e?.status === 401) {
                    setError('TOKEN')
                }
                else {
                    setError('DEFAULT')
                }
            }
        }
        else {
            setError('DEFAULT')
        }
    }

    useEffect(() => {
        checkDomainToken()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { name, error, refetch: (options?: Partial<Options>) => checkDomainToken(options) }
}

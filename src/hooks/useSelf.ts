import { fetchSelf, hasPermissions } from '../utils/api'

import { AUTH_TYPES } from '../constants/constants'
import { useEffect } from 'preact/hooks'
import { useOptions } from './useOptions'
import { useSafeState } from './useSafeState'

const cacheInfo = {
    id: null,
    time: 0,
    name: null
}

export function useSelf() {
    const [error, setError] = useSafeState(null)
    const [name, setName] = useSafeState(null)
    const { data: externalOptions, actions } = useOptions()

    const checkDomainToken = async (override?: Partial<Options>) => {
        const { token, domain, user, authenticationType, instance, offlineMode } = {...externalOptions, ...(override ?? {})}

        if (offlineMode) {
            setError(null)
            setName('Offline User')
            return
        }

        const cookieAuth = instance === 'datacenter' && authenticationType === AUTH_TYPES.COOKIE
        if (domain.length && (token.length || cookieAuth)) {
            const id = `${domain}${token}`
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
                const res = await fetchSelf({ token, domain })

                if (cacheInfo.id === id && cookieAuth && (!res.user || (user?.length && res.user !== user))) {
                    return setError('COOKIE_AUTH_MISSING')
                }

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
                    setError(cookieAuth ? 'COOKIE_AUTH_MISSING' : 'TOKEN')
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

import { createContext, ReactNode, useContext, useMemo } from 'preact/compat'
import { useOptions } from '../hooks/useOptions'
import { resolveLocale } from './locale'

const LocaleContext = createContext<string | null>(resolveLocale())

// Pure provider - pass locale directly
export function LocaleProvider({ locale, children }: { locale?: string; children: ReactNode }) {
    const resolvedLocale = useMemo(() => resolveLocale(locale), [locale])
    return <LocaleContext.Provider value={resolvedLocale}>{children}</LocaleContext.Provider>
}

// Options-connected provider - reads from useOptions
export function LocaleProviderWithOptions({ children }: { children: ReactNode }) {
    const {
        data: { locale }
    } = useOptions()

    return <LocaleProvider locale={locale}>{children}</LocaleProvider>
}

export function useLocaleContext(): string | null {
    return useContext(LocaleContext)
}

import { createGlobalStyle } from 'styled-components'

export const CssVariables = createGlobalStyle`
    :root {
        ${({ theme }) => Object.keys(theme).reduce((styles, prop) => `${styles}\n${prop}: ${theme[prop]};`, '')}
    }

    html {
        background-color: var(--background-off);
    }

    input, select {
        color-scheme: var(--color-scheme);
        background-color: var(--background)
    }
`

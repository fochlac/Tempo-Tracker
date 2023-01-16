import { darken, getLuminance, lighten, mix } from "polished";

export const createTheme = ({
    link,
    font,
    background,
    destructive,
    diagramm,
    diagrammGreen
}) => {
    const contrast = mix(0.5, font, background)
    const button = mix(0.1, font, background)
    return {
        '--background': background,
        '--background-off': getLuminance(background) > getLuminance(font) ? darken(0.025, background) : lighten(0.025, background),
        '--background-off-strong': getLuminance(background) > getLuminance(font) ? darken(0.1, background) : lighten(0.1, background),
        '--color-scheme': getLuminance(background) > getLuminance(font) ? 'light' : 'dark',
        '--diagramm': diagramm,
        '--diagramm-green': diagrammGreen,
        '--font': font,
        '--link': link,
        '--backdrop': '#00000040',
        '--link-hover': lighten(0.1, link),
        '--link-active': darken(0.1, link),
        '--contrast': mix(0.5, font, background),
        '--contrast-light': lighten(0.15, contrast),
        '--contrast-lighter': lighten(0.25, contrast),
        '--contrast-dark': darken(0.1, contrast),
        '--contrast-darker': darken(0.2, contrast),
        '--default-button-background': button,
        '--default-button-active': darken(0.025, button),
        '--default-button-hover': lighten(0.025, button),
        '--destructive': destructive,
        '--destructive-lightest': lighten(0.52, destructive),
        '--destructive-button-active': darken(0.025, destructive),
        '--destructive-button-hover': lighten(0.025, destructive),
        '--destructive-dark': darken(0.2, destructive),
        '--destructive-darker': darken(0.3, destructive),
}
}
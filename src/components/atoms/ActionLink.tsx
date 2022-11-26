import React = require('react')
import styled from 'styled-components'
import { preventDefault } from '../../utils/events'

interface ActionLinkRawProps {
    disabled?: boolean
    small?: boolean
    light?: boolean
    theme?: {
        linkColor: string
        linkColorHover: string
        linkColorActive: string
        linkColorDisabled: string
        linkColorLight: string
        linkColorHoverLight: string
        linkColorActiveLight: string
        linkColorDisabledLight: string
    }
}

const getLinkColour =
    (state = '') =>
    ({ theme, light, disabled }: ActionLinkRawProps) => {
        if (disabled) {
            return light ? theme.linkColorDisabledLight : theme.linkColorDisabled
        }
        if (state === 'hover') {
            return light ? theme.linkColorHoverLight : theme.linkColorHover
        }
        if (state === 'active') {
            return light ? theme.linkColorActiveLight : theme.linkColorActive
        }
        return light ? theme.linkColorLight : theme.linkColor
    }

export const ActionLinkRaw = styled.a<ActionLinkRawProps>`
    text-decoration: none;
    cursor: pointer;
    font-size: ${(props) => (props.small ? '0.8rem' : '')};
    letter-spacing: 0.1px;
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    color: ${getLinkColour()};
    margin-left: 4px;

    &:hover {
        color: ${getLinkColour('hover')};
    }
    &:active {
        color: ${getLinkColour('active')};
    }
`
ActionLinkRaw.defaultProps = {
    theme: {
        linkColor: '#1e6bf7',
        linkColorHover: '#407ef1',
        linkColorActive: '#0e46af',
        linkColorDisabled: '#c3cbd2',
        linkColorLight: '#e6f1f2',
        linkColorHoverLight: '#d0e3e6',
        linkColorActiveLight: '#c0d4da',
        linkColorDisabledLight: '#adadad'
    }
}

export const ActionLink: React.FC<{
    onClick: (e: Event) => void
    disabled?: boolean
    small?: boolean
    style?: React.CSSProperties
    as?: string | React.ComponentType<any>;
    for?: string;
}> = ({ onClick, disabled, as, ...props }) => {
    return (
        <ActionLinkRaw
            onClick={preventDefault((e) => !disabled && typeof onClick === 'function' && onClick(e))}
            disabled={disabled}
            as={as}
            {...props}
        />
    )
}

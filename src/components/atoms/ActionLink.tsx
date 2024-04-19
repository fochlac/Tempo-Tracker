import React = require('react')
import styled from 'styled-components'
import { preventDefault } from '../../utils/events'

interface ActionLinkRawProps {
    $disabled?: boolean;
    $small?: boolean;
    $error?: boolean;
}

export const ActionLinkRaw = styled.a<ActionLinkRawProps>`
    text-decoration: none;
    cursor: pointer;
    font-size: ${(props) => (props.$small ? '0.8rem' : '')};
    letter-spacing: 0.1px;
    cursor: ${(props) => (props.$disabled ? 'default' : 'pointer')};
    color: ${(props) => {
        if (props.$disabled) {
            return 'var(--contrast)'
        } 
        return props.$error ? 'var(--destructive) !important' : 'var(--link)'
    }};
    pointer-events: ${(props) => (props.$disabled ? 'none' : 'all')};
    margin-left: 4px;

    &:hover {
        color: var(--link-hover);
    }
    &:active {
        color: var(--link-active);
    }
`

export const ActionLink: React.FC<{
    onClick: (e: Event) => void
    disabled?: boolean
    small?: boolean
    error?: boolean
    title?: string;
    style?: React.CSSProperties
    as?: string | React.ComponentType<any>;
    for?: string;
}> = ({ onClick, disabled, as, small, error, ...props }) => {
    return (
        <ActionLinkRaw
            onClick={preventDefault((e) => !disabled && typeof onClick === 'function' && onClick(e))}
            $disabled={disabled}
            $small={small}
            $error={error}
            as={as}
            {...props}
        />
    )
}

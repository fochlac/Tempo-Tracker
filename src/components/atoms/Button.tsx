import styled from 'styled-components'

export const BaseButton = styled.button<{disabled?: boolean}>`
    border: 1px solid var(--contrast);
    background-color: var(--default-button-background);
    color: var(--font);    
    cursor: ${(props) => props.disabled ? 'default' : 'pointer'};
    opacity: ${(props) => props.disabled ? 0.5 : 1};
    pointer-events: ${(props) => props.disabled ? 'none' : 'all'};
    border-radius: 3px;

    &:hover {
        background: var(--default-button-hover);
        border-color: var(--contrast-dark);
    }

    &:active {
        background: var(--default-button-active);
        border-color: var(--contrast-dark);
    }
`

export const Button = styled(BaseButton)`
    padding: 4px 16px;
`

export const DestructiveButton = styled(Button)`
    background: var(--destructive);
    border-color: var(--destructive-dark);
    color: var(--destructive-lightest);
    font-weight: 700;
    margin-right: 1px;
    margin-left: auto;

    &:hover {
        background: var(--destructive-button-hover);
        border-color: var(--destructive-darker);
    }

    &:active {
        background: var(--destructive-button-active);
        border-color: var(--destructive-darker);
    }
`

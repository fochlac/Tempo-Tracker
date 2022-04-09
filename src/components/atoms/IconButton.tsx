import styled from 'styled-components'

export const IconButton = styled.button<{small?: boolean}>`
    padding: 1px;
    border: 1px solid rgb(191, 199, 207);
    background-color: rgb(239, 239, 239);
    color: rgb(32, 38, 45);
    border-radius: 3px;
    cursor: pointer;
    width: ${(props) => props.small ? '20px' : '22px'};
    height: ${(props) => props.small ? '20px' : '22px'};
    opacity: ${(props) => props.disabled ? 0.5 : 1};
    pointer-events: ${(props) => props.disabled ? 'none' : 'all'};

    & > svg {
        width: ${(props) => props.small ? '16px' : '18px'};
        height: ${(props) => props.small ? '16px' : '18px'};
    }

    &:hover {
        border-color: rgb(181, 189, 197);
        background-color: rgb(229, 229, 229);
    }

    &:active {
        background-color: rgb(239, 239, 239);
        border-color: rgb(171, 179, 187);
    }
`

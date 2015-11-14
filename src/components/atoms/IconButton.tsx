import styled from 'styled-components'

export const IconButton = styled.button`
    padding: 2px;
    border: 1px solid rgb(191, 199, 207);
    background-color: rgb(239, 239, 239);
    color: rgb(32, 38, 45);
    border-radius: 3px;
    cursor: pointer;
    width: 24px;
    height: 24px;
    opacity: ${(props) => props.disabled ? 0.5 : 1};
    pointer-events: ${(props) => props.disabled ? 'none' : 'all'};

    & > svg {
        width: 18px;
        height: 18px;
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

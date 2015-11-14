import styled from 'styled-components'

export const Button = styled.button`
    padding: 4px 16px;
    border: 1px solid rgb(191, 199, 207);
    background-color: rgb(239, 239, 239);
    color: rgb(32, 38, 45);
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        border-color: rgb(181, 189, 197);
        background-color: rgb(229, 229, 229);
    }

    &:active {
        background-color: rgb(239, 239, 239);
        border-color: rgb(171, 179, 187);
    }
`

export const DestructiveButton = styled(Button)`
    background: #f32121;
    border-color: #aa1717;
    color: #fff;
    font-weight: 700;
    margin-right: 1px;
    margin-left: auto;

    &:hover {
        background: #de0c0c;
        border-color: #820707;
    }

    &:active {
        background: #ff4b2e;
        border-color: #aa1717;
    }
`

import styled from 'styled-components'

export const ButtonBar = styled.nav`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: flex-end;
    width: 100%;

    & > button {
        margin-right: 8px;
        margin-left: 0;
    }
    & > button:last-child {
        margin-right: 0;
    }
`

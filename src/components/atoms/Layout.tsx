import styled from 'styled-components'

export const FlexRow = styled.div<{justify?: string, align?: string; flip?: number}>`
    display: flex;
    flex-direction: row;
    justify-content: ${({ justify = 'space-between' }) => justify};
    align-items: ${({ align = 'center' }) => align};

    @media (max-width: ${(props) => props.flip || 0}px) {
        flex-direction: column;
    }
`

export const FlexColumn = styled.div<{justify?: string, align?: string; flip?: number}>`
    display: flex;
    flex-direction: column;
    justify-content: ${({ justify = 'space-between' }) => justify};
    align-items: ${({ align = 'center' }) => align};
    width: 100%;

    @media (max-width: ${(props) => props.flip || 0}px) {
        flex-direction: row;
    }
`

import styled from 'styled-components'

export const FlexRow = styled.div<{$justify?: string, $align?: string; $flip?: number}>`
    display: flex;
    flex-direction: row;
    justify-content: ${({ $justify = 'space-between' }) => $justify};
    align-items: ${({ $align = 'center' }) => $align};

    @media (max-width: ${(props) => props.$flip || 0}px) {
        flex-direction: column;
    }
`

export const FlexColumn = styled.div<{$justify?: string, $align?: string; $flip?: number}>`
    display: flex;
    flex-direction: column;
    justify-content: ${({ $justify = 'space-between' }) => $justify};
    align-items: ${({ $align = 'center' }) => $align};
    width: 100%;

    @media (max-width: ${(props) => props.$flip || 0}px) {
        flex-direction: row;
    }
`

export const Block = styled.div`
    display: flex;
    padding: 8px;
    padding-right: 0;
    flex-direction: row;
    justify-content: space-between;
`
export const Column = styled.div`
    flex-grow: 1;
    flex-basis: 100%;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    margin-right: 8px;
`

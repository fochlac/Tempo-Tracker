import styled from 'styled-components'
interface Props {
    error?: boolean
}
export const Input = styled.input<Props>`
    margin-top: 2px;
    height: 20px;
    padding: 0 2px;
    border: none;
    border-bottom: solid 1px;
    background: var(--background);
    color: var(--font);
    ${({error}) => error ? 'border-color: var(--destructive);' : ''}
    ${({error}) => error ? 'color: var(--destructive);' : ''}
    ${({readOnly}) => readOnly ? 'border-bottom: none;' : ''}
    outline: none;
`

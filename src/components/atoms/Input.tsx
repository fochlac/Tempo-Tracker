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
    ${({error}) => error ? 'border-color: #e00404;' : ''}
    ${({error}) => error ? 'color: #e00404;' : ''}
    ${({readOnly}) => readOnly ? 'border-bottom: none;' : ''}
    outline: none;
`

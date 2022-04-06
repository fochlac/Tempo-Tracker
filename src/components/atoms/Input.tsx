import styled from 'styled-components'

export const Input = styled.input<{error?: boolean}>`
    margin-top: 2px;
    height: 20px;
    border: none;
    border-bottom: solid 1px;
    ${({error}) => error ? 'border-color: darkred;' : ''}
    ${({error}) => error ? 'color: darkred;' : ''}
    outline: none;
`

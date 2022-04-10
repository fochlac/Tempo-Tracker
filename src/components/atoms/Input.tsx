import styled from 'styled-components'

export const Input = styled.input<{error?: boolean}>`
    margin-top: 2px;
    height: 20px;
    padding: 0 2px;
    border: none;
    border-bottom: solid 1px;
    ${({error}) => error ? 'border-color: #e00404;' : ''}
    ${({error}) => error ? 'color: #e00404;' : ''}
    outline: none;
`

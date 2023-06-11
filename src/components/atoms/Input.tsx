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
    ${(props) => props.error ? 'border-color: var(--destructive);' : ''}
    ${(props) => props.error ? 'color: var(--destructive);' : ''}
    ${(props) => props.readOnly ? 'color: var(--font-disabled);' : ''}
    ${(props) => props.readOnly ? 'cursor: default;' : ''}
    outline: none;
    font-size: 14px;
`

export const Textarea = styled.textarea<Props>`
    margin-top: 2px;
    height: 56px;
    padding: 0 2px;
    border: none;
    border-bottom: solid 1px;
    background: var(--background);
    color: var(--font);
    ${(props) => props.error ? 'border-color: var(--destructive);' : ''}
    ${(props) => props.error ? 'color: var(--destructive);' : ''}
    ${(props) => props.readOnly ? 'color: var(--font-disabled);' : ''}
    ${(props) => props.readOnly ? 'cursor: default;' : ''}
    outline: none;
    width: 100%;
    resize: vertical;
    background: var(--default-button-background);
`
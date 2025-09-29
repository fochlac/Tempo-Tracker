import styled from 'styled-components'

export const DefaultText = styled.p`
    margin: 0px;
    font-weight: 400;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.01071em;
    color: var(--font);
`

export const ErrorText = styled(DefaultText)`
    color: var(--destructive);
    padding: 0 16px;
    text-align: justify;
    letter-spacing: -0.1px;
    cursor: default;
`
export const InfoText = styled(DefaultText)`
    padding: 2px 0px;
    text-align: justify;
    letter-spacing: -0.1px;
    margin-bottom: 4px;
    font-size: 12px;
    font-family: sans-serif;
`
export const ErrorInfoText = styled(InfoText)`
    height: 0;
    padding: 0;
    color: var(--destructive);
    text-align: right;
    margin-top: -4px;
    margin-bottom: 4px;
`

export const SmallerText = styled.p`
    font-size: 0.95rem;
    line-height: 1.1rem;
    display: block;
    margin-right: 8px;
    margin-top: 4px;
    margin-bottom: 8px;
    overflow: hidden;
    color: var(--font);
    width: 100%;
    text-align: justify;
    padding: 0 4px;
    box-sizing: border-box;
`

export const Label = styled.legend`
    cursor: default;
    display: flex;
    width: auto;
    padding: 0px;
    height: 11px;
    font-size: 0.75rem;
    max-width: 100%;
    color: var(--font);
    margin-bottom: 2px;
    font-weight: 600;
    white-space: nowrap;
`

export const H6 = styled.h6`
    font-size: 0.8rem;
    margin: 16px 0 4px;
    border-bottom: solid 1px var(--contrast-dark);
    padding-left: 2px;
    color: var(--font);
`

export const H5 = styled.h5`
    font-size: 1.2rem;
    margin: 8px 0;
    color: var(--font);
`

export const Value = styled(DefaultText)`
    margin-top: 2px;
    height: 20px;
    padding: 0 2px;
    border: none;
    border-bottom: solid 1px;
`

import styled from "styled-components";

const Mandatory = styled.span`
    color: var(--destructive);
    font-size: 14px;
    display: inline-block;
    margin-top: -3px;
    margin-left: 2px;
`

export const MandatoryStar = () => <Mandatory>*</Mandatory>
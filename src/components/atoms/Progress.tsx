import { Loader } from 'preact-feather'
import styled, { keyframes } from 'styled-components'

const movebar = keyframes`
    from {
        background-position: 0 0;
    }
    to {
        background-position: 700px 0;
    }
`

export const ProgressIndeterminate = styled.figure`
    width: 100%;
    height: 4px;
    position: relative;

    &:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(90deg, var(--background) 0%, cornflowerblue 20%, cornflowerblue 60%, var(--background) 80%);
        background-position: 0 0;
        background-repeat: repeat-x;
        animation: ${movebar} 3s linear infinite;
        background-size: 700px;
    }
`

const lighten = keyframes`
    0%{
        stroke: currentcolor;
    } 
    80%{
        stroke: currentcolor;
    }
    81%{
        stroke: #656565;
    }
    100% {
        stroke: #656565;
    }
`

export const CircularProgress = styled(Loader)`
    & > line {
        animation: ${lighten} 1.6s infinite;
    }

    & > line:nth-child(1) {
        animation-delay: -1.6s;
    }
    & > line:nth-child(2) {
        animation-delay: -0.8s;
    }
    & > line:nth-child(3) {
        animation-delay: -0.2s;
    }
    & > line:nth-child(4) {
        animation-delay: -1s;
    }
    & > line:nth-child(5) {
        animation-delay: -0.4s;
    }
    & > line:nth-child(6) {
        animation-delay: -1.2s;
    }
    & > line:nth-child(7) {
        animation-delay: -0.6s;
    }
    & > line:nth-child(8) {
        animation-delay: -1.4s;
    }
`

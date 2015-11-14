import styled, { keyframes } from 'styled-components'

const movebar = keyframes`
    from {
        background-position: 0 0;
    }
    to {
        background-position: 700px 0;
    }
`

export const ProgressIndeterminate = styled.div`
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
        background-image: linear-gradient(90deg, #fff 0%, cornflowerblue 20%, cornflowerblue 60%, #fff 80%);
        background-position: 0 0;
        background-repeat: repeat-x;
        animation: ${movebar} 3s linear infinite;
        background-size: 700px;
    }
`


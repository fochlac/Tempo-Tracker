import { ChevronUp } from 'preact-feather'
import styled, { keyframes } from 'styled-components'

const visibility = keyframes`
    0% {
        opacity: 0;
    }
    33% {
        opacity: 1;
    }
    66% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
`

const AnimatedChevronUp = styled(ChevronUp)`
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    color: 	var(--link);
    animation: ${visibility} 1s linear infinite;
`
const Wrapper = styled.div`
    position: relative;
    width: 18px;
    height: 18px;
    display: inline-block;
    overflow: hidden;
    margin-bottom: -3px;
`

export function UploadIcon ({style}) {
    return <Wrapper style={style}>
        <AnimatedChevronUp size={18} style={{ top: -6, animationDelay: '0.2s' }} />
        <AnimatedChevronUp size={18} style={{ animationDelay: '0.1s' }} />
        <AnimatedChevronUp size={18} style={{ top: 6 }} />
    </Wrapper>
}

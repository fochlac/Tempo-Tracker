import { ChevronUp } from "preact-feather";
import styled, { keyframes } from 'styled-components'

const visibility = keyframes`
    0% {
        opacity: 0;
    }
    20% {
        opacity: 0;
    }
    40% {
        opacity: 1;
    }
    60% {
        opacity: 1;
    }
    70% {
        opacity: 0;
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
    color: 	#2A52BE;
    animation: ${visibility} 2s linear infinite;
`
const Wrapper = styled.div`
    position: relative;
    width: 18px;
    height: 18px;
    display: inline-block;
    overflow: hidden;
    margin-bottom: -3px;
`

export function UploadIcon() {
    return <Wrapper>
        <AnimatedChevronUp size={18} style={{ top: -6, animationDelay: '0.4s' }} />
        <AnimatedChevronUp size={18}  style={{ animationDelay: '0.2s' }} />
        <AnimatedChevronUp size={18} style={{ top: 6 }}  />
    </Wrapper>
}
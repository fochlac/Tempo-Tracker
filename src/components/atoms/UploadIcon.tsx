import { ChevronUp } from "preact-feather";
import styled, { keyframes } from 'styled-components'

const AnimatedChevronUp = styled(ChevronUp)`
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    color: 	var(--link);
    animation: opacityAnimation 1s linear infinite;
`
const Wrapper = styled.div`
    position: relative;
    width: 18px;
    height: 18px;
    display: inline-block;
    overflow: hidden;
    margin-bottom: -3px;
`

export function UploadIcon({style}) {
    return <Wrapper style={style}>
        <AnimatedChevronUp size={18} style={{ top: -6, animationDelay: '0.2s' }} />
        <AnimatedChevronUp size={18}  style={{ animationDelay: '0.1s' }} />
        <AnimatedChevronUp size={18} style={{ top: 6 }}  />
    </Wrapper>
}
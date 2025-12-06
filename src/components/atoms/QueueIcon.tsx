import { Layers, ArrowUp } from 'preact-feather'
import styled from 'styled-components'

const Wrapper = styled.div`
    position: relative;
    width: 18px;
    height: 18px;
    display: inline-block;
    overflow: hidden;
    margin-bottom: -3px;
`

const Arrow = styled(ArrowUp)`
    top: -2px;
    position: absolute;
    margin: 0 2px;
    stroke-width: 3px;
    z-index: 5;
`
const Box = styled(Layers)`
    top: 5px;
    position: absolute;
    margin: 0 1px;
    z-index: 1;

    & > polyline:nth-child(2) {
        display: none;
    }
`
const White = styled.div`
    background-color: var(--background);
    position: absolute;
    width: 8px;
    height: 9px;
    z-index: 3;
    margin: 0 5px;
`

export function QueueIcon({ style }) {
    return (
        <Wrapper style={style}>
            <Arrow size={14} />
            <White />
            <Box size={16} />
        </Wrapper>
    )
}

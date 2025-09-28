import styled from 'styled-components'
import { Tooltip } from './Tooltip'

const Diagramm = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    height: 200px;
    justify-content: space-around;
    border-bottom: 1px solid var(--contrast);
    margin-top: 16px;
    position: relative;
    border-left: 1px solid var(--contrast);
    padding-left: 4px;
    margin-bottom: 20px;
    margin-left: 16px;
    margin-right: 8px;
    flex-shrink: 0;

    &:after {
        content: '';
        height: 100%;
        position: absolute;
        width: 20px;
        right: -20px;
        background-color: var(--background);
    }
`

const Bar = styled.div`
    display: flex;
    background: var(--diagramm);
    position: relative;
    width: 100%;
    border-bottom: none;
`
const BarWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 32px;
    height: 100%;
    justify-content: flex-end;
`
const BarLabel = styled.legend`
    position: absolute;
    bottom: -21px;
    white-space: nowrap;
    font-size: 12px;
    width: 100%;
    text-align: center;
    cursor: default;
    line-height: 16px;

    &:before {
        content: '';
        position: absolute;
        width: 2px;
        height: 4px;
        background: var(--contrast);
        top: -4px;
        left: calc(50% - 1px);
    }
`
const TimeBar = styled.legend`
    position: absolute;
    bottom: 0;
    top: 0;
    width: 20px;
    left: -20px;
`
const Time = styled.span`
    position: absolute;
    white-space: nowrap;
    height: 20px;
    font-size: 11px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    right: 4px;
    width: 20px;

    &:before {
        content: '';
        position: absolute;
        width: 100vw;
        height: 0px;
        top: 10px;
        left: 24px;
        border-top: dashed var(--contrast) 1px;
    }
`
const OverHours = styled.span`
    position: absolute;
    top: 0;
    width: 100%;
    border: solid 1px var(--diagramm-green);
    border-bottom: none;
    background: var(--diagramm-green);
    display: flex;
    align-items: stretch;
    justify-content: stretch;

    > div {
        flex-grow: 1;
    }
`
const MissingHours = styled.span`
    width: 100%;
    border: dashed 1px var(--diagramm);
    background: repeating-linear-gradient(-45deg, transparent, transparent 5px, var(--diagramm) 5px, var(--diagramm) 6px);
    border-bottom: none;
    z-index: 2;
    display: flex;
    align-items: stretch;
    justify-content: stretch;

    > div {
        flex-grow: 1;
    }
`
const BarTooltip = styled(Tooltip)`
    &:before {
        white-space: nowrap;
        min-width: 200px;
        max-width: 300px;
    }
`

export { Diagramm, Bar, BarWrapper, BarLabel, TimeBar, Time, OverHours, MissingHours, BarTooltip }

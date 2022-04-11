import styled from "styled-components"

const Wrapper = styled.div`
    position: relative;
    
    &:before {
        content: attr(data-content);
        position: absolute;
        top: calc(100% + 6px);
        max-width: min(150%, 100vw);
        min-width: max(50%, 100px);
        white-space: normal;
        display: none;
        font-size: 12px;
        background: white;
        border: grey solid 1px;
        padding: 4px;
        text-align: center;
        z-index: 1000;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    &:hover:before {
        display: flex;
    }

    &:after {
        display: none;
        content: '';
        position: absolute;
        top: calc(100% + 1px);
        left: calc(50% - 4px);
        width: 0; 
        height: 0; 
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 6px solid grey;
    }

    &:hover:after {
        display: block;
    }

`

interface TooltipProps {
    content: string;
    className?: string;
    style?: React.CSSProperties;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, style, className }) => {
    if (!content) return <>{children}</>
    return <Wrapper className={className} data-content={content} style={style}>
        {children}
    </Wrapper>
}


export const ErrorTooltip = styled(Tooltip)`
    &:before {
        color: darkred;
        background: lightpink;
        border-color: darkred;
    }
    &:after {
        border-bottom: 6px solid darkred;
        z-index: 1000
    }
`
export const ErrorTooltipTop = styled(Tooltip)`
    &:before {
        left: -93px;
        bottom: calc(100% + 7px);
        top: unset;
        color: darkred;
        background: lightpink;
        border-color: darkred;
    }

    &:after {
        top: unset;
        bottom: calc(100%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid darkred;
        border-bottom: transparent solid;
    }
`
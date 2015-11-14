import styled from "styled-components"

const Wrapper = styled.div`
    position: relative;
    
    &:after {
        content: '';
        display: none;
        position: absolute;
        top: calc(100%);
        max-width: min(150%, 100vw);
        min-width: max(50%, 100px);
        height: 5px;
    }

    &:hover:after {
        display: flex;
    }

    &:before {
        content: attr(data-content);
        position: absolute;
        top: calc(100% + 5px);
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
import styled from 'styled-components'

const Wrapper = styled.div<{ $right: boolean; $absolute?: boolean }>`
    position: ${({ $absolute }) => ($absolute ? 'absolute' : 'relative')};
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    &:before {
        content: attr(data-content);
        position: absolute;
        top: calc(100% + 6px);
        max-width: min(150%, 100vw);
        min-width: max(50%, 100px);
        white-space: normal;
        display: none;
        font-size: 12px;
        background: var(--background);
        border: var(--contrast) solid 1px;
        padding: 4px;
        text-align: center;
        z-index: 1000;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        ${({ $right }) => (!$right ? 'right: 0;' : 'left: 0;')}
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
        border-bottom: 6px solid var(--contrast);
    }

    &:hover:after {
        display: block;
    }
`

interface TooltipProps {
    content: string
    className?: string
    right?: boolean
    absolute?: boolean
    onClick?: (e: unknown) => void
    style?: React.CSSProperties
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, style, className, right, onClick, absolute }) => {
    if (!content) return <>{children}</>
    return (
        <Wrapper onClick={onClick} className={className} data-content={content} style={style} $right={right} $absolute={absolute}>
            {children}
        </Wrapper>
    )
}

export const TooltipTop = styled(Tooltip)`
    &:before {
        bottom: calc(100% + 7px);
        right: 0;
        top: unset;
    }

    &:after {
        top: unset;
        bottom: calc(100%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 6px solid var(--contrast);
        border-bottom: transparent solid;
    }
`

export const ErrorTooltip = styled(Tooltip)`
    &:before {
        color: var(--destructive-dark);
        background: var(--destructive-lightest);
        border-color: var(--destructive-dark);
    }
    &:after {
        border-bottom: 6px solid var(--destructive-dark);
        z-index: 1000;
    }
`
export const ErrorTooltipTop = styled(TooltipTop)`
    &:before {
        color: var(--destructive-dark);
        background: var(--destructive-lightest);
        border-color: var(--destructive-dark);
    }
    &:after {
        border-top: 6px solid var(--destructive-dark);
    }
`

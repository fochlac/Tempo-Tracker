import { createPortal } from 'preact/compat'
import styled from 'styled-components'

const Dialog = styled.dialog`
    width: 100%;
    height: 100%;
    background-color: var(--background);
    border: solid 1px var(--contrast);
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    
    ::-webkit-scrollbar-thumb {
        background: var(--contrast-light);
    }

    ::-webkit-scrollbar-thumb:hover {
        background: var(--contrast);
    }
`
const Overlay = styled.div`
    z-index: 10;
    content: '';
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 5vh 5vw;
    background-color: var(--backdrop);
    display: flex;
    justify-content: center;
    align-items: center;
`
interface Props {
    style?: React.CSSProperties;
}
export const Modal: React.FC<Props> = ({ children, style }) => {
    return createPortal(
        <Overlay>
            <Dialog open style={style}>{children}</Dialog>
        </Overlay>,
        document.querySelector('.modal')
    )
}

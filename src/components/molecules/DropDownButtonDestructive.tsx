import { useState } from 'react'
import styled from 'styled-components'
import { ChevronDown, ChevronUp } from 'preact-feather'
import { DestructiveButton } from '../atoms/Button'
import { useRef } from 'preact/hooks'

const ButtonWrapper = styled.div<{open?: boolean}>`
    display: flex;
    border: solid var(--destructive-dark);
    border-radius: 3px;
    background: var(--destructive);
    position: relative;
    border-bottom-left-radius: ${(props) => props.open ? 0 : 3}px;
    border-bottom-right-radius: ${(props) => props.open ? 0 : 3}px;
    border-width: 1px;

    ${props => props.open ? `
    &:before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #0000001f;
    }` : ''}

    &:hover {
        border-color: var(--destructive-darker);
    }
`

const MainButton = styled(DestructiveButton)`
    white-space: nowrap;
    margin-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border: none;
    z-index: 1;
`

const MenuButton = styled(DestructiveButton)`
    margin-right: 0;
    padding: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border: none;
    border-left: 1px solid var(--destructive-darker);
    display: flex;
    align-items: center;
    z-index: 1;
`

const MenuList = styled.ul`
    position: absolute;
    top: 100%;
    width: calc(100% + 2px);
    list-style: none;
    left: -1px;
    border: solid var(--destructive-dark);
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    border-width: 1px;
    overflow: hidden;
    z-index: 1000;
    border-top: none;

    &:hover {
        border-color: var(--destructive-darker);
    }
`
const ListItem = styled.li`
        display: flex;
`
const ListButton = styled(DestructiveButton)`
    width: 100%;
    margin: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
    white-space: nowrap;
`

interface ListButton extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'onClick'> {
    label: string;
    onClick: (e) => void;
}
interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    buttonList?: ListButton[]
}

export const DropDownButtonDestructive: React.FC<Props> = ({ children, buttonList, style, ...props }) => {
    const [open, setOpen] = useState(false)

    const iconStyles = {
        display: 'block',
        marginTop: -2
    }
    const onClose = useRef(() => {
        setOpen(false)
    })
    const handleClick = (open) => (e) => {
        if (open) {
            document.removeEventListener('click', onClose.current)
        }
        else {
            document.addEventListener('click', onClose.current)
        }
        setOpen(!open)
        e.stopPropagation()
    }

    return (
        <ButtonWrapper open={open}>
            <MainButton {...props}>{children}</MainButton>
            <MenuButton aria-label="Open Button List" onClick={handleClick(open)}>
                {open ? <ChevronUp size={18} style={iconStyles} /> : <ChevronDown size={18} style={iconStyles} />}
            </MenuButton>
            {open && (
                <MenuList>
                    {buttonList.map(({ label, onClick, ...props }) => (
                        <ListItem>
                            <ListButton 
                                onClick={(e) => {
                                    onClick(e);
                                    handleClick(true)(e)
                                }}
                                {...props}
                            >
                                {label}
                            </ListButton>
                        </ListItem>
                    ))}
                </MenuList>
            )}
        </ButtonWrapper>
    )
}

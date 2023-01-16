import styled from 'styled-components'
import { BaseButton } from './Button'

export const IconButton = styled(BaseButton)<{small?: boolean}>`
    padding: 1px;
    width: ${(props) => props.small ? '20px' : '22px'};
    height: ${(props) => props.small ? '20px' : '22px'};

    & > svg {
        width: ${(props) => props.small ? '16px' : '18px'};
        height: ${(props) => props.small ? '16px' : '18px'};
    }
`

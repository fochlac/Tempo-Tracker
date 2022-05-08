import { useDispatch } from '../../utils/atom'
import { ActionLink } from './ActionLink'


export const InternalLink: React.FC<{to: VIEWS, disabled?: boolean, style?: React.CSSProperties}> = ({to, ...props}) => {
    const dispatch = useDispatch()
    return <ActionLink {...props} onClick={() => dispatch('setView', to)} />
}
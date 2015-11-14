import { VIEWS } from '../../store/ducks/view'
import { useDispatch } from '../../utils/atom'
import { ActionLink } from './ActionLink'

export const InternalLink: React.FC<{to: VIEWS}> = ({to, ...props}) => {
    const dispatch = useDispatch()
    return <ActionLink {...props} onClick={() => dispatch('setView', to)} />
}
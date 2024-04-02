import styled from 'styled-components'
import { useOptions } from '../../hooks/useOptions'

import { ActionLink } from '../atoms/ActionLink'
import { openTab } from '../../utils/browser'
import { Workday } from 'src/utils/workday'
import { useSafeState } from 'src/hooks/useSafeState'
import { useEffect } from 'preact/hooks'
import { Unlock } from 'preact-feather'
import { ErrorTooltip } from '../atoms/Tooltip'
import { FlexRow } from '../atoms/Layout'

const LockIcon = styled(Unlock)`
    width: 16px;
    height: 16px;
    margin-left: 4px;
    margin-bottom: -3px;
    margin-top: -4px;
    color: var(--destructive);
    cursor: pointer;
`

export const WorkdayLink: React.FC = () => {
    const { data: options, actions } = useOptions()
    const [hasPermission, setHasPermission] = useSafeState(true)

    useEffect(() => {
        if (options.domain.includes('ttt-sp.com')) {
            Workday.hasPermission().then(setHasPermission)
        }
    }, [options.domain])

    if (!options.domain.includes('ttt-sp.com')) {
        return null
    }

    const onClick = () => {
        openTab({ url: Workday.timeTrackingPage, active: true })
    }

    const onGrantPermissions = async (e) => {
        e.stopPropagation()
        e.preventDefault()

        let granted = hasPermission
        if (!hasPermission) {
            granted = await Workday.requestPermission()
            await Workday.registerScript()
            if (granted) {
                setHasPermission(true)
            }
        }
        if (!options.workdaySync && granted) {
            actions.merge({ workdaySync: true })
        }
        openTab({ url: Workday.timeTrackingPage, active: true })
    }

    return (
        <ErrorTooltip
            onClick={onGrantPermissions}
            right
            content={
                !hasPermission
                    ? 'Permissions to access Workday are missing. Click the lock-icon to grant permissions.'
                    : undefined
            }
        >
            <FlexRow>
                <ActionLink error={!hasPermission} onClick={onClick}>
                    Workday
                </ActionLink>
                {!hasPermission ? <LockIcon onClick={onGrantPermissions} /> : null}
            </FlexRow>
        </ErrorTooltip>
    )
}

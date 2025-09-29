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
import { triggerBackgroundAction } from 'src/utils/background'
import { ACTIONS } from 'src/constants/actions'
import { useLocalized } from 'src/hooks/useLocalized'

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
    const { data: options } = useOptions()
    const [hasPermission, setHasPermission] = useSafeState(true)
    const { t } = useLocalized()

    useEffect(() => {
        if (options.domain.includes('ttt-sp.com')) {
            Workday.hasPermission().then(setHasPermission)
        }
    }, [options.domain, setHasPermission])

    if (!options.domain.includes('ttt-sp.com')) {
        return null
    }

    const onClick = () => {
        openTab({ url: Workday.timeTrackingPage, active: true })
    }

    const onGrantPermissions = async (e) => {
        e.stopPropagation()
        e.preventDefault()

        if (!hasPermission) {
            triggerBackgroundAction(ACTIONS.AWAIT_WORKDAY_PERMISSION)
            await Workday.requestPermission()
        }
        openTab({ url: Workday.timeTrackingPage, active: true })
    }

    return (
        <ErrorTooltip onClick={onGrantPermissions} content={!hasPermission ? t('workday.permissionsMissing') : undefined}>
            <FlexRow>
                <ActionLink error={!hasPermission} onClick={onClick}>
                    {t('workday.workday')}
                </ActionLink>
                {!hasPermission ? <LockIcon onClick={onGrantPermissions} /> : null}
            </FlexRow>
        </ErrorTooltip>
    )
}

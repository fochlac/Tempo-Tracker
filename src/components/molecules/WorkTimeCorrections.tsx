import { Trash2 } from 'preact-feather'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { useLocalized } from 'src/hooks/useLocalized'
import { Button } from '../atoms/Button'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label } from '../atoms/Typography'

const toHours = (seconds: number): number => Math.round((seconds / 3600) * 100) / 100
const toSeconds = (hours: number): number => Math.round((Math.round(hours * 100) / 100) * 3600)

export const WorkTimeCorrections: React.FC = () => {
    const { data: options, actions } = useStatisticsOptions()
    const { t } = useLocalized()

    const updateCorrectionDate = (index: number) => (e) => {
        actions.setCorrectionDate(index, e.currentTarget.value)
    }

    const updateCorrectionHours = (index: number) => (e) => {
        const hours = Number(e.currentTarget.value)
        actions.setCorrection(index, Number.isFinite(hours) ? toSeconds(hours) : 0)
    }

    return (
        <>
            <H6>{t('section.overhourCorrections')}</H6>
            {options.settlements.map((settlement, index) => {
                return (
                    <Block key={`${settlement.date}-${index}`}>
                        <Column>
                            <Label>{t('label.effectiveDate')}</Label>
                            <Input type="date" value={settlement.date} onChange={updateCorrectionDate(index)} />
                        </Column>
                        <Column>
                            <Label>{t('label.deltaHours')}</Label>
                            <Input type="number" value={toHours(settlement.deltaSeconds)} step={1} onChange={updateCorrectionHours(index)} />
                        </Column>
                        <Column style={{ flexBasis: 'auto', justifyContent: 'flex-end' }}>
                            <IconButton onClick={() => actions.deleteCorrection(index)}>
                                <Trash2 />
                            </IconButton>
                        </Column>
                    </Block>
                )
            })}
            <Block>
                <Button onClick={() => actions.addCorrection()}>{t('action.addCorrection')}</Button>
            </Block>
        </>
    )
}

import { Trash2 } from 'preact-feather'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { useLocalized } from 'src/hooks/useLocalized'
import { Button } from '../atoms/Button'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label } from '../atoms/Typography'

export const WorkTimeExceptions: React.FC = () => {
    const { data: options, actions } = useStatisticsOptions()
    const { t } = useLocalized()

    const updateExceptionKey = (key, index) => (e) => actions.mergeException(index, { [key]: Number(e.target.value) })

    return (
        <>
            <H6>{t('section.worktimeOverrides')}</H6>
            {options.exceptions?.map((exception, index) => (
                <Block key={index}>
                    <Column>
                        <Label>{t('label.firstWeek')}</Label>
                        <Input
                            type="number"
                            min={0}
                            value={exception.startWeek}
                            max={exception.startYear === exception.endYear ? exception.endWeek : 53}
                            step={1}
                            onChange={updateExceptionKey('startWeek', index)}
                        />
                    </Column>
                    <Column>
                        <Label>{t('label.firstYear')}</Label>
                        <Input
                            type="number"
                            min={2000}
                            value={exception.startYear}
                            max={exception.endYear}
                            step={1}
                            onChange={updateExceptionKey('startYear', index)}
                        />
                    </Column>
                    <Column>
                        <Label>{t('label.finalWeek')}</Label>
                        <Input
                            type="number"
                            min={exception.startYear === exception.endYear ? exception.startWeek : 0}
                            value={exception.endWeek}
                            max={53}
                            step={1}
                            onChange={updateExceptionKey('endWeek', index)}
                        />
                    </Column>
                    <Column>
                        <Label>{t('label.finalYear')}</Label>
                        <Input
                            type="number"
                            min={exception.startYear}
                            value={exception.endYear}
                            max={2099}
                            step={1}
                            onChange={updateExceptionKey('endYear', index)}
                        />
                    </Column>
                    <Column>
                        <Label>{t('label.hoursPerWeek')}</Label>
                        <Input type="number" min={0} value={exception.hours} max={48} step={0.1} onChange={updateExceptionKey('hours', index)} />
                    </Column>
                    <Column style={{ flexBasis: 'auto', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => actions.deleteException(index)}>
                            <Trash2 />
                        </IconButton>
                    </Column>
                </Block>
            ))}
            <Block>
                <Button onClick={() => actions.addException()}>{t('action.addException')}</Button>
            </Block>
        </>
    )
}

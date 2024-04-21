import { Trash2 } from 'preact-feather'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { Button } from '../atoms/Button'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label } from '../atoms/Typography'

export const WorkTimeExceptions: React.FC = () => {
    const { data: options, actions } = useStatisticsOptions()

    const updateExceptionKey = (key, index) => (e) => actions.mergeException(index, { [key]: Number(e.target.value) })

    return (
        <>
            <H6>Work-time Overrides</H6>
            {options.exceptions?.map((exception, index) => (
                <Block key={index}>
                    <Column>
                        <Label>First Week</Label>
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
                        <Label>First Year</Label>
                        <Input type="number" min={2000} value={exception.startYear} max={exception.endYear} step={1} onChange={updateExceptionKey('startYear', index)} />
                    </Column>
                    <Column>
                        <Label>Final Week</Label>
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
                        <Label>Final Year</Label>
                        <Input type="number" min={exception.startYear} value={exception.endYear} max={2099} step={1} onChange={updateExceptionKey('endYear', index)} />
                    </Column>
                    <Column>
                        <Label>Hours per Week</Label>
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
                <Button onClick={() => actions.addException()}>Add Exception</Button>
            </Block>
        </>
    )
}

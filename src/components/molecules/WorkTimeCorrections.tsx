import { Trash2 } from 'preact-feather'
import { getISOWeeks } from 'src/utils/datetime'
import { resolveLocale } from 'src/translations/locale'
import { useStatisticsOptions } from '../../hooks/useStatisticsOptions'
import { useOptions } from 'src/hooks/useOptions'
import { useLocalized } from 'src/hooks/useLocalized'
import { Button } from '../atoms/Button'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { H6, Label } from '../atoms/Typography'

const toHours = (seconds: number): number => Math.round((seconds / 3600) * 100) / 100
const toSeconds = (hours: number): number => Math.round((Math.round(hours * 100) / 100) * 3600)

const parseWeekKey = (weekKey: string): { year: number; week: number } => {
    const [year, week] = weekKey.split('-').map((value) => Number(value))
    return {
        year: Number.isFinite(year) ? year : new Date().getFullYear(),
        week: Number.isFinite(week) ? week : 1
    }
}

const normalizeYearWeek = (year: number, week: number, locale: string): { year: number; week: number } => {
    let normalizedYear = Math.round(year)
    let normalizedWeek = Math.round(week)
    const weeksInYear = getISOWeeks(normalizedYear, locale)

    if (normalizedWeek < 1) {
        normalizedYear--
        normalizedWeek += getISOWeeks(normalizedYear, locale)
    } else if (normalizedWeek > weeksInYear) {
        normalizedWeek -= getISOWeeks(normalizedYear, locale)
        normalizedYear++
    }

    return { year: normalizedYear, week: normalizedWeek }
}

export const WorkTimeCorrections: React.FC = () => {
    const { data: options, actions } = useStatisticsOptions()
    const { data: appOptions } = useOptions()
    const { t } = useLocalized()
    const locale = resolveLocale(appOptions.locale)

    const correctionEntries = Object.entries(options.corrections ?? {})

    const updateCorrectionWeek = (weekKey: string) => (e) => {
        const parsed = parseWeekKey(weekKey)
        const nextWeek = Number(e.currentTarget.value)
        if (!Number.isFinite(nextWeek)) {
            return
        }

        const { year: targetYear, week: targetWeek } = normalizeYearWeek(parsed.year, nextWeek, locale)

        actions.renameCorrectionKey(weekKey, `${targetYear}-${targetWeek}`)
    }

    const updateCorrectionYear = (weekKey: string) => (e) => {
        const parsed = parseWeekKey(weekKey)
        const nextYear = Number(e.currentTarget.value)
        const { year: targetYear, week: targetWeek } = normalizeYearWeek(Number.isFinite(nextYear) ? nextYear : parsed.year, parsed.week, locale)
        actions.renameCorrectionKey(weekKey, `${targetYear}-${targetWeek}`)
    }

    const updateCorrectionHours = (weekKey: string) => (e) => {
        const hours = Number(e.currentTarget.value)
        actions.setCorrection(weekKey, Number.isFinite(hours) ? toSeconds(hours) : 0)
    }

    return (
        <>
            <H6>{t('section.overhourCorrections')}</H6>
            {correctionEntries.map(([weekKey, deltaSeconds], index) => {
                const correction = parseWeekKey(weekKey)

                return (
                    <Block key={index}>
                        <Column>
                            <Label>{t('label.correctionWeek')}</Label>
                            <Input type="number" min={0} max={54} step={1} value={correction.week} onChange={updateCorrectionWeek(weekKey)} />
                        </Column>
                        <Column>
                            <Label>{t('label.correctionYear')}</Label>
                            <Input type="number" min={1900} max={2099} step={1} value={correction.year} onChange={updateCorrectionYear(weekKey)} />
                        </Column>
                        <Column>
                            <Label>{t('label.deltaHours')}</Label>
                            <Input type="number" value={toHours(deltaSeconds)} step={1} onChange={updateCorrectionHours(weekKey)} />
                        </Column>
                        <Column style={{ flexBasis: 'auto', justifyContent: 'flex-end' }}>
                            <IconButton onClick={() => actions.deleteCorrection(weekKey)}>
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

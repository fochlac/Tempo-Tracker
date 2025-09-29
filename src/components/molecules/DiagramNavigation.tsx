import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'preact-feather'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { DefaultText } from '../atoms/Typography'
import { useLocalized } from 'src/hooks/useLocalized'

interface Props {
    year: number
    setYear: (year: number) => void
    error: boolean
    canScrollLeft: boolean
    canScrollRight: boolean
    onPreviousClick: () => void
    onNextClick: () => void
    onFirstClick: () => void
    onLastClick: () => void
    previousTitle?: string
    month?: string
    nextTitle?: string
    firstTitle?: string
    lastTitle?: string
}

export const DiagramNavigation: React.FC<Props> = ({
    year,
    month = '',
    setYear,
    error,
    canScrollLeft,
    canScrollRight,
    onPreviousClick,
    onNextClick,
    onFirstClick,
    onLastClick,
    previousTitle,
    nextTitle,
    firstTitle,
    lastTitle
}) => {
    const { t } = useLocalized()
    // fallback to translations if props not provided
    const _previousTitle = previousTitle || t('nav.previous')
    const _nextTitle = nextTitle || t('nav.next')
    const _firstTitle = firstTitle || t('nav.goToFirst')
    const _lastTitle = lastTitle || t('nav.goToLast')
    const currentYear = new Date().getFullYear()

    return (
        <Block style={{ userSelect: 'none' }}>
            <Column style={{ justifyContent: 'flex-start', flexDirection: 'row' }}>
                <IconButton disabled={!canScrollLeft} onClick={onFirstClick} title={_firstTitle} style={{ marginRight: 4 }}>
                    <ChevronsLeft />
                </IconButton>
                <IconButton disabled={!canScrollLeft} onClick={onPreviousClick} title={_previousTitle}>
                    <ChevronLeft />
                </IconButton>
            </Column>
            <Block style={{ alignItems: 'center', padding: 0, gap: 8 }}>
                {month && <DefaultText style={{ marginTop: 2, minWidth: 75, marginLeft: -50, textAlign: 'right' }}>{month}</DefaultText>}
                <Input
                    disabled={error}
                    type="number"
                    style={{ width: 65 }}
                    min={2000}
                    value={year}
                    max={currentYear}
                    step={1}
                    onChange={(e) => setYear(Number(e.target.value))}
                />
            </Block>
            <Column style={{ justifyContent: 'flex-end', flexDirection: 'row' }}>
                <IconButton disabled={!canScrollRight} onClick={onNextClick} title={_nextTitle} style={{ marginRight: 4 }}>
                    <ChevronRight />
                </IconButton>
                <IconButton disabled={!canScrollRight} onClick={onLastClick} title={_lastTitle}>
                    <ChevronsRight />
                </IconButton>
            </Column>
        </Block>
    )
}

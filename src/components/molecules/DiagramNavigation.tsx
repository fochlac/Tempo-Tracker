import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'preact-feather'
import { IconButton } from '../atoms/IconButton'
import { Input } from '../atoms/Input'
import { Block, Column } from '../atoms/Layout'
import { Label } from '../atoms/Typography'

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
    nextTitle?: string
    firstTitle?: string
    lastTitle?: string
}

export const DiagramNavigation: React.FC<Props> = ({
    year,
    setYear,
    error,
    canScrollLeft,
    canScrollRight,
    onPreviousClick,
    onNextClick,
    onFirstClick,
    onLastClick,
    previousTitle = "Previous",
    nextTitle = "Next",
    firstTitle = "Go to first",
    lastTitle = "Go to last"
}) => {
    const currentYear = new Date().getFullYear()

    return (
        <Block style={{ userSelect: 'none' }}>
            <Column style={{ justifyContent: 'flex-start', flexDirection: 'row' }}>
                <IconButton
                    disabled={!canScrollLeft}
                    onClick={onFirstClick}
                    title={firstTitle}
                    style={{ marginRight: 4 }}
                >
                    <ChevronsLeft />
                </IconButton>
                <IconButton
                    disabled={!canScrollLeft}
                    onClick={onPreviousClick}
                    title={previousTitle}
                >
                    <ChevronLeft />
                </IconButton>
            </Column>
            <Column style={{ alignItems: 'center' }}>
                <Label style={{ width: 65 }}>Year</Label>
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
            </Column>
            <Column style={{ justifyContent: 'flex-end', flexDirection: 'row' }}>
                <IconButton
                    disabled={!canScrollRight}
                    onClick={onNextClick}
                    title={nextTitle}
                    style={{ marginRight: 4 }}
                >
                    <ChevronRight />
                </IconButton>
                <IconButton
                    disabled={!canScrollRight}
                    onClick={onLastClick}
                    title={lastTitle}
                >
                    <ChevronsRight />
                </IconButton>
            </Column>
        </Block>
    )
}

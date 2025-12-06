import { useRef, useState } from 'preact/hooks'
import styled from 'styled-components'
import { Button } from '../atoms/Button'
declare global {
    interface ToggleBarOption {
        value: string
        color?: string
        name?: string
        title?: string
        tooltip?: string
        disabled?: boolean
        full?: boolean
    }
}
interface Props {
    options: ToggleBarOption[]
    value?: string
    defaultValue?: string
    unselect?: boolean
    onChange: (value: string) => void
}
const Bar = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center
    flex-direction: row;
    width: 99.99%;
    min-height: 32px;
`
const Color = styled.div<{ $color?: string }>`
    ${(props) =>
        props.$color
            ? `
    display: inline-block;
    width: 8px;
    height: 8px;
    background: ${props.$color};
    margin-right: 4px;
    `
            : ''}
`

const ToggleButton = styled(Button)<{ $first?: boolean; $last?: boolean; $selected?: boolean; $firstRow: boolean; $lastRow: boolean }>`
    border-radius: 0;
    font-size: 12px;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border-left-color: var(--contrast) !important;
    border-right-color: var(--contrast) !important;
    border-top-color: var(--contrast) !important;
    ${(props) =>
        props.$selected
            ? `
        background: var(--background) !important;
        border-bottom: var(--font) solid 1px !important;
        font-weight: 700;
    `
            : ''}
    ${(props) => (props.$first && props.$firstRow ? 'border-top-left-radius: 3px;' : '')}
    ${(props) => (props.$first && props.$lastRow ? 'border-bottom-left-radius: 3px;' : '')}
    ${(props) => (props.$last && props.$firstRow ? 'border-top-right-radius: 3px;' : '')}
    ${(props) => (props.$last && props.$lastRow ? 'border-bottom-right-radius: 3px;' : '')}
    ${(props) => (!props.$firstRow ? 'border-top: none;' : '')}
`
const ButtonText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`

export const ToggleBar: React.FC<Props> = ({ options, unselect, defaultValue, value, onChange }) => {
    const isControlled = useRef(value !== undefined)
    const [localSelected, setSelected] = useState(defaultValue)
    const selected = isControlled.current ? value : localSelected
    const onClick = (val, disabled) => () => {
        if (disabled) return
        if (val !== selected) {
            onChange(val)
            setSelected(val)
        } else if (unselect) {
            onChange(null)
            setSelected(null)
        }
    }

    if (!options || options.length === 0) return null

    const rowLength = 5
    const rowNumber = Math.ceil((options.length + 1) / rowLength)
    const realRowLength = (options.length + 1) / rowNumber
    const chunks = []
    let lastEnd = 0
    for (let currentRow = 1; currentRow <= rowNumber; currentRow++) {
        const chunkSize = Math.ceil(realRowLength - currentRow / rowNumber)
        chunks.push(options.slice(lastEnd, lastEnd + chunkSize))
        lastEnd += chunkSize
    }

    return (
        <>
            {chunks.map((chunk, chunkIndex) => (
                <Bar key={chunkIndex}>
                    {chunk.map(({ value, name, color, disabled, full, title }, index) => {
                        return (
                            <ToggleButton
                                key={index}
                                $firstRow={chunkIndex === 0}
                                $lastRow={chunkIndex === chunks.length - 1}
                                style={{ marginLeft: index === 0 ? 0 : -1, flexShrink: full ? 0 : 1 }}
                                onClick={onClick(value, disabled)}
                                $first={index === 0}
                                $last={index === chunk.length - 1}
                                disabled={disabled}
                                title={title || name || value}
                                $selected={value === selected}
                            >
                                <Color $color={color} />
                                <ButtonText>{name || value}</ButtonText>
                            </ToggleButton>
                        )
                    })}
                </Bar>
            ))}
        </>
    )
}

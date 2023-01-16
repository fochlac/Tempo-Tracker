import { useRef, useState } from "preact/hooks";
import styled from "styled-components";
import { Button } from "../atoms/Button";

interface ToggleBarOption {
    value: string;
    color?: string;
    name?: string;
    tooltip?: string;
}
interface Props {
    options: ToggleBarOption[];
    value?: string;
    defaultValue?: string;
    unselect?: boolean;
    onChange: (value: string) => void
}
const Bar = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center
    flex-direction: row;
    width: 100%;
    min-height: 32px;
`
const Color = styled.div<{color?: string}>`
    ${(props) => props.color ? `
    display: inline-block;
    width: 8px;
    height: 8px;
    background: ${props.color};
    margin-right: 4px;
    ` : ''}
`

const ToggleButton = styled(Button) <{ first?: boolean; last?: boolean; selected?: boolean; firstRow: boolean; lastRow: boolean }>`
    border-radius: 0;
    font-size: 12px;
    flex-grow: 1;
    border-left-color: var(--contrast) !important;
    border-right-color: var(--contrast) !important;
    border-top-color: var(--contrast) !important;
    ${({ selected }) => selected ? `
        background: var(--background) !important;
        border-bottom: var(--font) solid 1px !important;
        font-weight: 700;
    ` : ''}
    ${({ first, firstRow }) => first && firstRow ? 'border-top-left-radius: 3px;' : ''}
    ${({ first, lastRow }) => first && lastRow ? 'border-bottom-left-radius: 3px;' : ''}
    ${({ last, firstRow }) => last && firstRow ? 'border-top-right-radius: 3px;' : ''}
    ${({ last, lastRow }) => last && lastRow ? 'border-bottom-right-radius: 3px;' : ''}
    ${({ firstRow }) => !firstRow ? 'border-top: none;' : ''}
`

export const ToggleBar: React.FC<Props> = ({ options, unselect, defaultValue, value, onChange }) => {
    const isControlled = useRef(value !== undefined)
    const [localSelected, setSelected] = useState(defaultValue)
    const selected = isControlled.current ? value : localSelected
    const onClick = (val) => () => {
        if (val !== selected) {
            onChange(val)
            setSelected(val)
        }
        else if (unselect) {
            onChange(null)
            setSelected(null)
        }
    }
    let chunkSize = 4
    if (options.length % 3 === 0 || options.length % 4 !== 0 && options.length % 3 > options.length % 4) {
        chunkSize = 3
    }

    const chunkNumber = Math.ceil(options.length / chunkSize)
    const chunks = []
    for (let currentChunk = 0; currentChunk < chunkNumber; currentChunk++) {
        chunks.push(options.slice(currentChunk * chunkSize, (currentChunk + 1) * chunkSize))
    }

    return (
        <>{
            chunks.map((chunk, chunkIndex) => (
                <Bar key={chunkIndex}>
                    {
                        chunk.map(({ value, name, color }, index) => {
                            return (
                                <ToggleButton
                                    firstRow={chunkIndex === 0}
                                    lastRow={chunkIndex === chunks.length - 1}
                                    style={{ marginLeft: (index === 0) ? 0 : -1 }}
                                    onClick={onClick(value)}
                                    first={index === 0}
                                    last={index === chunk.length - 1}
                                    selected={value === selected}>
                                    <Color color={color} />
                                    {name || value}
                                </ToggleButton>
                            )
                        })
                    }
                </Bar>
            ))
        }</>
    )
}
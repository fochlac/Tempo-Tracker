import { useOptions } from 'src/hooks/useOptions'
import { Input } from './Input'
import { Label } from './Typography'
import { Option } from './Option'
import { useRef, useState } from 'preact/hooks'
import { parseToRgb, rgb } from 'polished'
import styled from 'styled-components'

const InputGrid = styled.div`
    display: grid;
    grid-template-columns: calc(100% - 24px) 20px;
    justify-content: space-between;
`
function parseColor(raw: string, full?:boolean): string|void {
    let color = null
    try {
        color = rgb(parseToRgb(raw))
    }
    catch (e) {}

    if (full && color.length === 4 && color.startsWith('#')) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    }
    return color
}

export const CustomThemeCssInput: React.FC<{ label: string; field: keyof Options['customTheme'] }> = ({label, field}) => {
    const { data: options, actions } = useOptions()
    const currentValue = useRef(options.customTheme[field])
    const [value, setValue] = useState(options.customTheme[field])

    if (currentValue.current !== options.customTheme[field]) {
        setValue(options.customTheme[field])
        currentValue.current = options.customTheme[field]
    }
    const onChangeColor = (e) => {
        setValue(e.target.value)

        try {
            const color = parseColor(e.target.value)
            if (color) {
                actions.merge({ customTheme: { ...options.customTheme, [field]: color } })
            }
        }
        catch (e) {}
    }

    return (
        <Option>
            <Label>{label}</Label>
            <InputGrid>
                <Input
                    onChange={onChangeColor}
                    value={value} />

                <Input
                    type="color"
                    style={{ width: 20, marginRight: 8 }}
                    value={parseColor(options.customTheme[field], true)}
                    onChange={onChangeColor}
                />
            </InputGrid>
        </Option>
    )
}

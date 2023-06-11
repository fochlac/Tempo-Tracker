import { useRef } from "preact/hooks"
import styled from "styled-components";

const InputWrapper = styled.fieldset`
    display: inline-flex;
    flex-direction: row;
    width: 42px;
    margin-top: 2px;
    height: 20px;
    border: none;
    border-bottom: solid 1px var(--font);
    color: var(--font);
    outline: none;
    align-items: center;
    padding-left: 1px;
    text-align: center;
    font-size: 14px;
`
const TimeSegmentInput = styled.input`
    width: 18px;
    background: var(--background);
    color: var(--font);
    text-align: center;
    ${(props) => props.readOnly ? 'color: var(--font-disabled);' : ''}
    ${(props) => props.readOnly ? 'cursor: default;' : ''}
`

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
    onChange: (value: Partial<InputEvent>) => void;
    duration?: boolean;
    readOnly?: boolean;
    maxHours?: number;
}
const handleFocus = (e) => e.target.setSelectionRange(0, e.target.value.length)
const createEvent = (value): Partial<InputEvent> => ({ target: { value } as any as EventTarget })

export const TimeInput: React.FC<Props> = ({ value, onChange, duration, maxHours, readOnly, ...props }) => {
    const hours = /^\d+:\d+$/.test(value?.trim()) ? `00${value.trim().split(':')[0]}`.slice(-2) : '00'
    const minutes = /^\d+:\d+$/.test(value?.trim()) ? `00${value.trim().split(':')[1]}`.slice(-2) : '00'
    const hoursInput = useRef<HTMLInputElement>()
    const minutesInput = useRef<HTMLInputElement>()
    const selectMinutes = () => minutesInput.current.setSelectionRange(0, minutes.length)
    const selectHours = () => hoursInput.current.setSelectionRange(0, hours.length)

    const handleChangeHour = (e) => {
        const newValue = e.target.value
        if (isNaN(Number(newValue)) || (!duration && Number(newValue) > 23)) {
            hoursInput.current.value = hours
            if (newValue.length === 1) {
                selectHours()
            }
            return
        }
        const value = `00${newValue}`.slice(-2)
        hoursInput.current.value = value
        onChange(createEvent(`${value}:${minutes}`))
        if (!duration && Number(value) > 2 || Number(value) > maxHours) {
            minutesInput.current?.focus()
        }
    }
    const handleChangeMinutes = (e) => {
        const newValue = e.target.value
        if (isNaN(Number(newValue)) || Number(newValue) > 59) {
            minutesInput.current.value = minutes
            if (newValue.length === 1) {
                selectMinutes()
            }
            return
        }
        const value = `00${newValue}`.slice(-2)
        minutesInput.current.value = value
        onChange(createEvent(`${hours}:${value}`))
        if (!duration && Number(value) > 5) {
            minutesInput.current?.blur()
        }
    }
    const handleKeysHour = (e) => {
        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault()
                const divisor = duration ? Infinity : 24
                const value = `00${(Number(hours) + 1) % divisor}`.slice(-2)
                onChange(createEvent(`${value}:${minutes}`))
            }
                break
            case 'ArrowDown': {
                e.preventDefault()
                const divisor = duration ? Infinity : 24
                const addend = duration ? -1 : 23
                const value = `00${(Number(hours) + addend) % divisor}`.slice(-2)
                if (Number(value) >= 0) {
                    onChange(createEvent(`${value}:${minutes}`))
                }
            }
                break
            case 'ArrowRight':
                e.preventDefault()
                minutesInput.current?.focus()
                break
        }
    }
    const handleKeysMinute = (e) => {
        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault()
                const valueMinutes = `00${(Number(minutes) + 1) % 60}`.slice(-2)
                let valueHours = hours
                if (Number(minutes) === 59) {
                    const divisor = duration ? Infinity : 24
                    valueHours = `00${(Number(hours) + 1) % divisor}`.slice(-2)
                }
                onChange(createEvent(`${valueHours}:${valueMinutes}`))
            }
                break
            case 'ArrowDown': {
                e.preventDefault()
                const valueMinutes = `00${(Number(minutes) + 59) % 60}`.slice(-2)
                let valueHours = hours
                if (Number(minutes) === 0) {
                    const divisor = duration ? Infinity : 24
                    const addend = duration ? -1 : 23
                    valueHours = `00${(Number(hours) + addend) % divisor}`.slice(-2)
                    if (Number(valueHours) < 0) {
                        valueHours = hours
                    }
                }
                onChange(createEvent(`${valueHours}:${valueMinutes}`))
            }
                break
            case 'ArrowLeft':
                e.preventDefault()
                hoursInput.current?.focus()
                break
        }
    }

    return (
        <InputWrapper {...props}>
            <TimeSegmentInput readOnly={readOnly} onKeyDown={handleKeysHour} ref={hoursInput} onFocus={handleFocus} onChange={handleChangeHour} value={hours} />
            <span>:</span>
            <TimeSegmentInput readOnly={readOnly} onKeyDown={handleKeysMinute} ref={minutesInput} onFocus={handleFocus} onChange={handleChangeMinutes} value={minutes} />
        </InputWrapper>
    )
}
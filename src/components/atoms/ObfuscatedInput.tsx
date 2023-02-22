import { useState } from "preact/hooks"
import { Input } from "../atoms/Input"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    error?: boolean;
    onChange: (value: string) => void;
}

export const ObfuscatedInput: React.FC<Props> = ({ value, onChange, ...props }) => {
    const [isFocused, setFocused] = useState(false)
    const [isDirty, setDirty] = useState(false)
    const [originalValue] = useState(value || '')
    
    const stars = value.length ? Array(Math.min(Math.max(value.length - 8, 12), 32)).fill('*').join('') : ''
    const valueObfuscated = `${value.slice(0, 4)}${stars}${value.slice(-4)}`


    return (
        <Input
            {...props}
            value={isFocused ? (isDirty && value || '') : valueObfuscated}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
                setFocused(false)
                if (typeof props.onBlur === 'function') {
                    props.onBlur(e)
                }
            }}
            onChange={(e) => {
                if (e.target.value?.length) {
                    setDirty(true)
                    onChange(e.target.value)
                }
                else {
                    setDirty(false)
                    onChange(originalValue)
                }
            }} />
    )
}
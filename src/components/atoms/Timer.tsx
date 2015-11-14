import { useEffect, useState } from "preact/hooks"
import { formatDuration } from "../../utils/datetime"

export function Timer({ start, ...spanProps }) {
    const [render, setRender] = useState(0)
    useEffect(() => {
        const interval = setInterval(() => setRender((v) => v + 1), 50)
        return () => clearInterval(interval)
    }, [])

    return <span {...spanProps} >{formatDuration(start ? Date.now() - start : 0)}</span>
}

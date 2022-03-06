import { useEffect, useState } from "preact/hooks"
import { formatDuration } from "../../utils/datetime"

export function Timer({ start, noSeconds, ...spanProps }) {
    const [render, setRender] = useState(0)
    useEffect(() => {
        const interval = setInterval(() => setRender((v) => v + 1), noSeconds ? 1000 : 50)
        return () => clearInterval(interval)
    }, [])

    return <span {...spanProps} >{formatDuration(start ? Date.now() - start : 0, noSeconds)}</span>
}

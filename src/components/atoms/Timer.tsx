import { useEffect, useState } from 'preact/hooks'
import { formatDuration } from '../../utils/datetime'
interface Props extends React.HTMLAttributes<HTMLTimeElement> {
    start?: number;
    noSeconds?: boolean;
}
export const Timer:React.FC<Props> = ({ start, noSeconds, ...spanProps }) => {
    const setRender = useState(0)[1]
    useEffect(() => {
        const interval = setInterval(() => setRender((v) => v + 1), noSeconds ? 1000 : 50)
        return () => clearInterval(interval)
    }, [noSeconds, setRender])

    return <time {...spanProps} >{formatDuration(start ? Date.now() - start : 0, noSeconds, true)}</time>
}

export const Conditional: React.FC<{ enable: boolean }> = (props) => {
    const { children, enable } = props

    if (!enable) {
        return null
    }

    return <>{children}</>
}

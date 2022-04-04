export function checkSameWorklog(logA:TemporaryWorklog) {
    return (logB: TemporaryWorklog) => {
        if (logA.tempId) {
            return logA.tempId === logB.tempId
        }
        return logA.id === logB.id
    }
}
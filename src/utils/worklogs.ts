export function checkSameWorklog (logA:TemporaryWorklog) {
    return (logB: TemporaryWorklog) => {
        if (logA.id) {
            return logA.id === logB.id
        }
        return logA.tempId === logB.tempId
    }
}

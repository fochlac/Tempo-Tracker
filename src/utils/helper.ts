export const compareValues = (list) => (a, b) => {
    return list.some(key => get(a, key) !== get(b, key))
}


function get(value, key) {
    return key.split('.').reduce((val, key) => val[key], value)
}
export const getUrlParam = (param) => new URLSearchParams(location.search).get(param)
export const isPopped = () => getUrlParam('popped') === '1'
export const setUrlParam = (param, value) => {
    const params = new URLSearchParams(location.search)
    params.set(param, value)
    location.search = params.toString()
}
export function openTab(options: Parameters<typeof browser.tabs.create>[0]) {
    if (isFirefox) {
        return browser.tabs.create(options)
    }
    return chrome.tabs.create(options)
}

export const openAsTab = (view) => {
    openTab({ active: true, url: `popup.html?popped=1&view=${view}` })
    if (typeof window !== 'undefined') {
        window.close()
    }
}

export const getPermission = (permission: browser.permissions.Permissions) => {
    const permissions = (isFirefox ? browser : chrome)?.permissions
    if (!permissions) return Promise.reject('Unable to access permission api.')
    return permissions.request(permission)
}
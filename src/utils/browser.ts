const controller = (typeof chrome !== 'undefined' && chrome) || (typeof browser !== 'undefined' && browser)
export function openTab(options: Parameters<typeof browser.tabs.create>[0]) {
    if (isFirefox) {
        return controller.tabs.create(options)
    }
    return controller.tabs.create(options)
}

export const openAsTab = (view) => {
    openTab({ active: true, url: `popup.html?popped=1&view=${view}` })
    if (typeof window !== 'undefined') {
        window.close()
    }
}

export const getPermission = (permission: browser.permissions.Permissions & chrome.permissions.Permissions) => {
    const permissions = controller?.permissions
    if (!permissions) return Promise.reject('Unable to access permission api.')
    return permissions.request(permission)
}

export const Location = {
    openTab(href) {
        window.open(href, 'blank')
    },
    reload() {
        window.location.reload()
    }
}

export const getAssetUrl = (path) => controller && controller.runtime.getURL(path)

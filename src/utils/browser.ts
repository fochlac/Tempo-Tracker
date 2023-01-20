export function openTab(options) {
    if (isFirefox){
        browser.tabs.create(options)
    }
    else {
        chrome.tabs.create(options)
    }
}

export const openAsTab = (view) => {
    openTab({ active: true, url: `popup.html?popped=1&view=${view}` })
    if (typeof window !== 'undefined') {
        window.close()
    }
}
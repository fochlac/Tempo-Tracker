export function openTab(options) {
    if (isFirefox){
        browser.tabs.create(options)
    }
    else {
        chrome.tabs.create(options)
    }
}
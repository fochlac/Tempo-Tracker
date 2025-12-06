import { withGlobal } from '@sinonjs/fake-timers'

Cypress.Commands.add('fakeTimers', (now: number) => {
    cy.window().then((win) => {
        const clock = withGlobal(win).install({
            now,
            shouldAdvanceTime: true,
            advanceTimeDelta: 20,
            toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame']
        })
        cy.wrap(clock).as('clock')
    })
})

Cypress.Commands.add('mockSendMessage', (withDelayedCallbacks = false) => {
    const callbacks: (() => void)[] = []
    cy.window().then((win) => {
        win.chrome.runtime.sendMessage = ((message, callback) => {
            win.messages = win.messages || []
            win.messages.push(message)
            const index = callbacks.length
            if (withDelayedCallbacks) {
                callbacks.push(() => {
                    callback({ payload: { success: true } })
                    callbacks[index] = undefined
                })
            } else {
                callback({ payload: { success: true } })
            }
        }) as typeof chrome.runtime.sendMessage
    })
    cy.wrap(callbacks).as('sendMessageCallbacks')
})

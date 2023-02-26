import { withGlobal } from '@sinonjs/fake-timers'

Cypress.Commands.add('fakeTimers', (now: number) => {
    cy.window().then((win) => {
        const clock = withGlobal(win).install({
            now,
            shouldAdvanceTime: true,
            advanceTimeDelta: 20,
            toFake: [
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'Date',
                'requestAnimationFrame',
                'cancelAnimationFrame'
            ]
        })
        cy.wrap(clock).as('clock')
    })
})

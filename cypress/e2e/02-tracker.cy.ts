
describe('Tracking view', () => {
    it('should show all entries', () => {
        cy.networkMocks()
        cy.openWithOptions()
        cy.window().then(win => {
            (win as any).chrome.runtime.sendMessage = (message, callback) => {
                callback({ payload: { success: true } })
            }
        })
        cy.contains('main', 'Tempo-Tracker').should('be.visible')
        cy.wait('@getWorklogs')
        cy.get('@clock').invoke('tick', 1000)
    })
})

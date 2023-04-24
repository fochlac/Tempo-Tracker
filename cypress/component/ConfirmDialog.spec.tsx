import { ConfirmDialog } from '../../src/components/molecules/ConfirmDialog'

describe('test', () => {
    it('test', () => {
        const onClose = cy.spy()
        cy.mount(<ConfirmDialog buttons={null} open onClose={onClose} title="title" text="text" />)
        cy.contains('h5', 'title').should('be.visible')
        cy.contains('div', 'text').should('be.visible')
        cy.contains('button', 'Cancel').should('be.visible').click()
        cy.wrap(onClose).should('have.been.called')
    })
})
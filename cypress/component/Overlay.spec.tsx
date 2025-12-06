import { Overlay } from '../../src/components/Overlay'
import { toWorktimeInfo } from '../../src/service-worker/workday'
import { toLocalWorklog } from '../../src/utils/api/datacenter-api'
import { Location } from '../../src/utils/browser'
import { defaultOptions, worklogs } from '../support/data'

const ERROR_COLOR = 'rgb(255, 220, 223)'
const SUCCESS_COLOR = 'rgb(238, 247, 241)'

const dayInMs = 24 * 60 * 60 * 1000
describe('Workday-Overlay', () => {
    const impressumUrl = 'test.html'
    function setup(options?: { insertWorkTime?: () => Promise<void>; workdayEntries?: WorkdayEntry[] }) {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        cy.stub(Location, 'openTab').as('openTab')
        const insertWorkTime = options?.insertWorkTime || cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 200))).as('insertSpy')
        const refresh = cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 100))).as('refreshSpy')
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = options?.workdayEntries || []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries, refresh, impressumUrl }} />)
        cy.contains('header', 'Tempo Tracker').should('be.visible')
    }

    it('should render', () => {
        setup()
        cy.contains('header', 'Tempo Tracker').should('be.visible')
        cy.contains('div', 'Florian Riedel').should('be.visible')
        cy.contains('a', 'Report Issue').should('exist').click()
        cy.get('@openTab').should('have.been.calledWith', 'https://github.com/fochlac/Tempo-Tracker/issues')
        cy.contains('a', 'Impressum').should('exist').click()
        cy.get('@openTab').should('have.been.calledWith', impressumUrl)
        cy.get('li').filter(':contains("/10/20")').should('have.length', 5)
        cy.get('li').filter(':contains(":00 - ")').should('have.length', 10)
        cy.get('li input').filter(':checked').should('have.length', 15)
        cy.contains('li', '09:00 - 09:30' + 'Test5').should('have.css', 'background-color', ERROR_COLOR)

        cy.contains('li', '07/10/20').find('input').should('be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .should('be.visible')
            .find('input')
            .should('be.checked')
        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled')
        cy.contains('button', 'Refresh').should('be.visible').should('not.be.disabled').click()
        cy.get('@refreshSpy').should('have.been.called')
    })

    it('should open and close', () => {
        setup()
        cy.contains('button', 'Upload').should('be.visible')
        cy.contains('header', 'Tempo Tracker').find('button').click()
        cy.contains('button', 'Upload').should('not.exist')
        cy.contains('header', 'Tempo Tracker').find('button').click()
        cy.contains('button', 'Upload').should('be.visible')
    })

    it('should select correctly', () => {
        setup()

        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .should('be.visible')
            .find('input')
            .click()

        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .should('not.be.checked')
        cy.contains('li', '07/10/20').find('input').should('not.be.checked').click()
        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .should('be.checked')

        cy.contains('li', '07/10/20').find('input').click()
        cy.contains('li', '07/10/20').find('input').should('not.be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .should('not.be.checked')
        cy.contains('li', '10:00 - 16:30' + 'TE3')
            .find('input')
            .should('not.be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .click()
        cy.contains('li', '10:00 - 16:30' + 'TE3')
            .find('input')
            .click()
        cy.contains('li', '07/10/20').find('input').should('be.checked')
    })

    it('should handle successful uploads correctly', () => {
        setup()

        cy.contains('li', '07/10/20').find('input').click()
        cy.contains('li', '06/10/20').find('input').click()
        cy.contains('li', '05/10/20').find('input').click()

        cy.get('[data-test="progress"]').should('not.exist')
        cy.contains('button', 'Upload').should('not.be.disabled').should('be.visible').click()
        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .should('not.be.checked')
            .should('be.disabled')
        cy.contains('li', '10:00 - 16:30' + 'TE3')
            .find('input')
            .should('not.be.checked')
            .should('be.disabled')
        cy.contains('li', '08:00 - 16:00' + 'Test2')
            .find('input')
            .should('be.checked')
            .should('be.disabled')
        cy.contains('button', 'Upload').should('be.disabled')
        cy.get('[data-test="progress"]').should('exist').find('div').should('have.length', 2)
        cy.get('[data-test="progress"]').should('exist').find('div').eq(0).as('first')
        cy.get('[data-test="progress"]').should('exist').find('div').eq(1).as('second')
        cy.get('@first').should('have.css', 'background-color', 'rgb(210, 226, 242)')
        cy.get('@second').should('not.have.css', 'background-color', 'rgb(210, 226, 242)')

        cy.get('@insertSpy').should('have.been.called', 2)
        cy.get('@insertSpy').should('have.been.calledWith', 1602223201000, 1602252000000)
        cy.get('@insertSpy').should('have.been.calledWith', 1602136801000, 1602165600000)
        cy.get('@reload').should('have.been.called')

        cy.contains('li', '07/10/20').find('input').click()
        cy.contains('button', 'Upload').should('not.be.disabled')
    })

    it('should handle failed uploads correctly', () => {
        const insertWorkTime = cy.spy(() => ({ error: 'Some message.' })).as('insertSpy')

        setup({ insertWorkTime })

        cy.contains('li', '09/10/20').find('input').click()
        cy.contains('li', '08/10/20').find('input').click()
        cy.contains('li', '06/10/20').find('input').click()
        cy.contains('li', '05/10/20').find('input').click()

        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled').click()

        cy.get('@insertSpy').should('have.been.called', 2)
        cy.get('@insertSpy').should('have.been.calledWith', 1602057601000, 1602081000000)
        cy.get('@insertSpy').should('have.been.calledWith', 1602052201000, 1602057600000)
        cy.get('@reload').should('have.not.been.called')

        cy.contains('li', '08:30 - 10:00' + 'Test5')
            .find('input')
            .should('be.checked')
        cy.contains('li', '10:00 - 16:30' + 'TE3')
            .find('input')
            .should('be.checked')
        cy.contains('button', 'Upload').should('not.be.disabled')
        cy.contains('li', '08:30 - 10:00' + 'Test5').should('have.css', 'background-color', ERROR_COLOR)
        cy.contains('li', '10:00 - 16:30' + 'TE3').should('have.css', 'background-color', ERROR_COLOR)
    })

    it('should show success & conflics', () => {
        const workdayEntries: WorkdayEntry[] = [
            { start: 1602057601000, end: 1602081000000, editUri: '1231231a' },
            { start: 1602052201000, end: 1602057600000, editUri: '1231231b' },
            { start: 1602223201000, end: 1602252000000, editUri: '1231231c' },
            { start: 1602136801000, end: 1602165600000, editUri: '1231231d' },
            { start: 1602057601000 - dayInMs, end: 1602081000000 - dayInMs, editUri: '1231231e' }
        ]
        setup({ workdayEntries })
        cy.get('li input').filter(':checked').should('have.length', 6)
        cy.contains('li', '08:30 - 10:00' + 'Test5').should('have.css', 'background-color', SUCCESS_COLOR)
        cy.contains('li', '10:00 - 16:30' + 'TE3').should('have.css', 'background-color', SUCCESS_COLOR)
        cy.contains('li', '08:00 - 16:00' + 'Test2').should('have.css', 'background-color', SUCCESS_COLOR)

        cy.contains('li', '14:00 - 17:00' + 'Test4').should('have.css', 'background-color', ERROR_COLOR)
        cy.contains('li', '11:00 - 12:30' + 'Test5').should('have.css', 'background-color', ERROR_COLOR)
        cy.contains('li', '09:00 - 11:00' + 'Test7').should('have.css', 'background-color', ERROR_COLOR)
        cy.contains('li', '09:00 - 09:30' + 'Test5').should('not.have.css', 'background-color', ERROR_COLOR)

        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled').click()
        cy.get('@insertSpy').should('have.been.calledWith', 1601899201000, 1601913600000)
        cy.get('@insertSpy').should('have.been.calledWith', 1601967601000, 1601969400000)
        cy.get('@insertSpy').should('have.been.calledWith', 1601892001000, 1601897400000)
        cy.get('@insertSpy').should('have.been.calledWith', 1601877601000, 1601890200000)
    })
})

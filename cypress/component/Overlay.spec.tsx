/* eslint-disable no-useless-concat */
import { Overlay } from '../../src/components/Overlay'
import { toWorktimeInfo } from '../../src/service-worker/workday'
import { toLocalWorklog } from '../../src/utils/api/datacenter-api'
import { Location } from '../../src/utils/browser'
import { defaultOptions, worklogs } from '../support/data'

const dayInMs = 24 * 60 * 60 * 1000
describe('Workday-Overlay', () => {
    it('should render', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 100)))
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')
        cy.contains('p', 'Workday Upload is experimental').should('be.visible')
        cy.get('li').filter(':contains(".10.20")').should('have.length', 5)
        cy.get('li').filter(':contains(":00 - ")').should('have.length', 10)
        cy.get('li input').filter(':checked').should('have.length', 16)

        cy.contains('li', '07.10.20').find('input').should('be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5').should('be.visible')
            .find('input').should('be.checked')
        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled')
    })

    it('should open and close', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 100)))
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')
        cy.contains('p', 'Workday Upload is experimental').should('be.visible')

        cy.contains('header', 'Tempo Tracker Times').find('button').click()
        cy.contains('p', 'Workday Upload is experimental').should('not.exist')
        cy.contains('header', 'Tempo Tracker Times').find('button').click()
        cy.contains('p', 'Workday Upload is experimental').should('be.visible')
    })

    it('should select correctly', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 100)))
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')

        cy.contains('li', '08:30 - 10:00' + 'Test5').should('be.visible')
            .find('input')
            .click()

        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').should('not.be.checked')
        cy.contains('li', '07.10.20').find('input').should('not.be.checked').click()
        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').should('be.checked')

        cy.contains('li', '07.10.20').find('input').click()
        cy.contains('li', '07.10.20').find('input').should('not.be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').should('not.be.checked')
        cy.contains('li', '10:00 - 16:30' + 'TE3').find('input').should('not.be.checked')
        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').click()
        cy.contains('li', '10:00 - 16:30' + 'TE3').find('input').click()
        cy.contains('li', '07.10.20').find('input').should('be.checked')
    })

    it('should handle successful uploads correctly', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy(() => new Promise((resolve) => setTimeout(() => resolve(null), 100)))
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')

        cy.contains('li', '07.10.20').find('input').click()
        cy.contains('li', '06.10.20').find('input').click()
        cy.contains('li', '05.10.20').find('input').click()

        cy.contains('button', 'Upload').should('not.be.disabled').should('be.visible').click()
        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').should('not.be.checked').should('be.disabled')
        cy.contains('li', '10:00 - 16:30' + 'TE3').find('input').should('not.be.checked').should('be.disabled')
        cy.contains('li', '08:00 - 16:00' + 'Test2').find('input').should('be.checked').should('be.disabled')
        cy.contains('button', 'Upload').should('be.disabled')

        cy.wrap(insertWorkTime).should('have.been.called', 2)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1602223201000, 1602252000000)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1602136801000, 1602165600000)
        cy.get('@reload').should('have.been.called')

        cy.contains('li', '07.10.20').find('input').click()
        cy.contains('button', 'Upload').should('not.be.disabled')
    })

    it('should handle failed uploads correctly', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy(() => ({ error: 'Some message.' }))
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries = []

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')

        cy.contains('li', '09.10.20').find('input').click()
        cy.contains('li', '08.10.20').find('input').click()
        cy.contains('li', '06.10.20').find('input').click()
        cy.contains('li', '05.10.20').find('input').click()

        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled').click()

        cy.wrap(insertWorkTime).should('have.been.called', 2)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1602057601000, 1602081000000)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1602052201000, 1602057600000)
        cy.get('@reload').should('have.not.been.called')

        cy.contains('li', '08:30 - 10:00' + 'Test5').find('input').should('be.checked')
        cy.contains('li', '10:00 - 16:30' + 'TE3').find('input').should('be.checked')
        cy.contains('button', 'Upload').should('not.be.disabled')
        cy.contains('li', '08:30 - 10:00' + 'Test5').should('have.css', 'background-color', 'rgb(255, 220, 223)')
        cy.contains('li', '10:00 - 16:30' + 'TE3').should('have.css', 'background-color', 'rgb(255, 220, 223)')
    })

    it('should show success & conflics', () => {
        cy.viewport(500, 750)
        cy.stub(Location, 'reload').as('reload')
        const insertWorkTime = cy.spy()
        const workTimes = worklogs.map(toLocalWorklog).map(toWorktimeInfo(defaultOptions))
        const workdayEntries:WorkdayEntry[] = [
            {start: 1602057601000, end: 1602081000000, editUri: '1231231a'},
            {start: 1602052201000, end: 1602057600000, editUri: '1231231b'},
            {start: 1602223201000, end: 1602252000000, editUri: '1231231c'},
            {start: 1602136801000, end: 1602165600000, editUri: '1231231d'},
            {start: 1602057601000 - dayInMs, end: 1602081000000 - dayInMs, editUri: '1231231e'}
        ]

        cy.mount(<Overlay {...{ workTimes, insertWorkTime, workdayEntries }} />)
        cy.contains('header', 'Tempo Tracker Times').should('be.visible')
        cy.get('li input').filter(':checked').should('have.length', 6)
        cy.contains('li', '08:30 - 10:00' + 'Test5').should('have.css', 'background-color', 'rgb(238, 247, 241)')
        cy.contains('li', '10:00 - 16:30' + 'TE3').should('have.css', 'background-color', 'rgb(238, 247, 241)')
        cy.contains('li', '08:00 - 16:00' + 'Test2').should('have.css', 'background-color', 'rgb(238, 247, 241)')

        cy.contains('li', '14:00 - 17:00' + 'Test4').should('have.css', 'background-color', 'rgb(255, 220, 223)')
        cy.contains('li', '11:00 - 12:30' + 'Test5').should('have.css', 'background-color', 'rgb(255, 220, 223)')
        cy.contains('li', '09:00 - 11:00' + 'Test7').should('have.css', 'background-color', 'rgb(255, 220, 223)')

        cy.contains('button', 'Upload').should('be.visible').should('not.be.disabled').click()
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1601967601000, 1601969400000)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1601899201000, 1601913600000)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1601892001000, 1601897400000)
        cy.wrap(insertWorkTime).should('have.been.calledWith', 1601877601000, 1601890200000)
    })
})

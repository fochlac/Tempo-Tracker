import { mount } from 'cypress/react'
import { CssVariables } from '../../src/components/atoms/CssVariables'
import { Themes } from '../../src/constants/themes'

Cypress.Commands.add('mount', (component, options = {}) => {
  return mount(
    <>
        <CssVariables theme={Themes.DARK} />
        {component}
    </>
    , options)
})
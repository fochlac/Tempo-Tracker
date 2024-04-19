import { mount } from 'cypress/react'
import { CssVariables } from '../../src/components/atoms/CssVariables'
import { Themes } from '../../src/constants/themes'
import { createTheme } from '../../src/utils/theme'

Cypress.Commands.add('mount', (component, options = {}) => {
  return mount(
    <>
        <CssVariables theme={createTheme(Themes.DARK)} />
        {component}
    </>
    , options)
})
import styled from 'styled-components'
import { useOptions } from '../../hooks/useOptions'
import { Input } from '../atoms/Input'
import { FlexRow } from '../atoms/Layout'
import { InfoText, Label } from '../atoms/Typography'
import { Option } from '../atoms/Option'
import { LOCALES, THEMES } from 'src/constants/constants'
import { Conditional } from '../atoms/Conditional'
import { SectionHead } from '../views/Options'
import { CustomThemeCssInput } from '../atoms/CustomThemeCssInput'
import { useLocalized } from 'src/hooks/useLocalized'
import { ActionLink } from '../atoms/ActionLink'
import { openTab } from 'src/utils/browser'

const isFirefox = navigator.userAgent.includes('Firefox')

const Select = styled.select`
    width: 200px;
`
const Table = styled.table`
    width: 100%;
    margin-top: 8px;
`
const Cell = styled.td`
    text-align: center;
`
const HeadCell = styled.th`
    text-align: center;
    padding-bottom: 4px;
`
const Grid = styled.div`
    display: grid;
    grid-template-columns: 32% 32% 32%;
    justify-content: space-between;
`

export const AppOptionsSection: React.FC = () => {
    const { data: options, actions } = useOptions()
    const { t, resolvedLocale, locale } = useLocalized()

    const isResolvedLocale = LOCALES[resolvedLocale] || LOCALES[resolvedLocale.split('-')[0]]

    // Define beta locales (locales that are machine translated)
    const isBetaLocale = [LOCALES.fr, LOCALES.es, LOCALES.pl].find((betaLocale) => betaLocale === locale.split('-')[0])

    return (
        <>
            <Conditional enable={!!isBetaLocale}>
                <InfoText style={{ marginBottom: 8, padding: 8, background: 'var(--contrast-lightest)', borderRadius: 4 }}>
                    {t('info.betaLocale')}{' '}
                    <ActionLink
                        onClick={() =>
                            openTab({
                                url: 'https://github.com/fochlac/Tempo-Tracker/issues/new?template=translation_improvement.md',
                                active: true
                            })
                        }
                    >
                        {t('link.suggestTranslation')}
                    </ActionLink>
                </InfoText>
            </Conditional>
            <Option>
                <Label>{t('label.localization')}</Label>
                <Select onChange={(e) => actions.merge({ locale: e.target.value })}>
                    {!isResolvedLocale && (
                        <option selected={!options.locale} value={null}>
                            {t('locale.en-default')}
                        </option>
                    )}
                    <option selected={isResolvedLocale && locale.split('-')[0] === LOCALES.en} value={LOCALES.en}>
                        {t('locale.en')}
                    </option>
                    <option selected={isResolvedLocale && locale === LOCALES['en-US']} value={LOCALES['en-US']}>
                        {t('locale.en-US')}
                    </option>
                    <option selected={isResolvedLocale && locale === LOCALES['en-CA']} value={LOCALES['en-CA']}>
                        {t('locale.en-CA')}
                    </option>
                    <option selected={isResolvedLocale && locale.split('-')[0] === LOCALES.de} value={LOCALES.de}>
                        {t('locale.de')}
                    </option>
                    <option selected={isResolvedLocale && locale.split('-')[0] === LOCALES.es} value={LOCALES.es}>
                        {t('locale.es')}
                    </option>
                    <option selected={isResolvedLocale && locale.split('-')[0] === LOCALES.fr} value={LOCALES.fr}>
                        {t('locale.fr')}
                    </option>
                    <option selected={isResolvedLocale && locale === LOCALES['fr-CA']} value={LOCALES['fr-CA']}>
                        {t('locale.fr-CA')}
                    </option>
                    <option selected={isResolvedLocale && locale.split('-')[0] === LOCALES.pl} value={LOCALES.pl}>
                        {t('locale.pl')}
                    </option>
                </Select>
            </Option>
            <Option>
                <Label>{t('label.hotkeys')}</Label>
                <InfoText>
                    <p>{t('info.hotkeysList')}</p>
                    <Table>
                        <tr>
                            <HeadCell>{t('hotkey.stopTracking')}</HeadCell>
                            <HeadCell>{t('hotkey.trackFirstIssue')}</HeadCell>
                            <HeadCell>{t('hotkey.trackSecondIssue')}</HeadCell>
                            <HeadCell>{t('hotkey.trackThirdIssue')}</HeadCell>
                        </tr>
                        <tr>
                            <Cell>{t('hotkey.ctrlShift0')}</Cell>
                            <Cell>{t('hotkey.ctrlShift1')}</Cell>
                            <Cell>{t('hotkey.ctrlShift2')}</Cell>
                            <Cell>{t('hotkey.ctrlShift3')}</Cell>
                        </tr>
                    </Table>
                </InfoText>
            </Option>
            <Option>
                <Label>{t('label.extendedComments')}</Label>
                <InfoText>{t('info.extendedCommentsDesc')}</InfoText>
                <FlexRow $justify="flex-start">
                    <Input
                        style={{ margin: '0 6px' }}
                        type="checkbox"
                        checked={options.showComments}
                        onChange={(e) => actions.merge({ showComments: e.target.checked })}
                    />
                    <Label>{t('label.enabled')}</Label>
                </FlexRow>
            </Option>
            <Option>
                <Label>{t('label.automaticSynchronization')}</Label>
                <FlexRow $justify="flex-start">
                    <Input
                        style={{ margin: '0 6px' }}
                        type="checkbox"
                        disabled={isFirefox}
                        checked={isFirefox ? false : options.autosync}
                        onChange={(e) => actions.merge({ autosync: e.target.checked })}
                    />
                    <Label>{t('label.enabled')}</Label>
                </FlexRow>
                {isFirefox && <InfoText>{t('info.firefoxSyncWarning')}</InfoText>}
            </Option>
            <Option>
                <Label>{t('label.theme')}</Label>
                <Select onChange={(e) => actions.merge({ theme: e.target.value })}>
                    <option selected={options.theme === THEMES.DEFAULT} value={THEMES.DEFAULT}>
                        {t('theme.lightDefault')}
                    </option>
                    <option selected={options.theme === THEMES.DARK} value={THEMES.DARK}>
                        {t('theme.dark')}
                    </option>
                    <option selected={options.theme === THEMES.CUSTOM} value={THEMES.CUSTOM}>
                        {t('theme.custom')}
                    </option>
                </Select>
            </Option>
            <Conditional enable={options.theme === THEMES.CUSTOM}>
                <SectionHead>{t('section.customTheme')}</SectionHead>
                <Grid>
                    <CustomThemeCssInput label={t('theme.background')} field="background" />
                    <CustomThemeCssInput label={t('theme.fontColor')} field="font" />
                    <CustomThemeCssInput label={t('theme.linkColor')} field="link" />
                    <CustomThemeCssInput label={t('theme.negativeColor')} field="destructive" />
                    <CustomThemeCssInput label={t('theme.diagramBarColor')} field="diagramm" />
                    <CustomThemeCssInput label={t('theme.diagramOverhourColor')} field="diagrammGreen" />
                </Grid>
            </Conditional>
        </>
    )
}

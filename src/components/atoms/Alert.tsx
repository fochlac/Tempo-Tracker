import { AlertOctagon, Info } from 'preact-feather'
import styled from 'styled-components'
import { ErrorText, InfoText } from './Typography'

const ErrorBox = styled(ErrorText)`
    padding: 4px 8px 4px 4px;
    border: solid var(--destructive) 1px;
    background: var(--destructive-lightest);
    border-radius: 2px;
    display: flex;
    flex-direction: row;
    align-items: center;
`
const StyledAlertOctagon = styled(AlertOctagon)`
    margin-left: 4px;
    margin-right: 8px;
    height: 28px;
    width: 28px;
`
const InfoBoxWrapper = styled(InfoText)`
    padding: 4px 8px 4px 4px;
    border: solid var(--contrast) 1px;
    background: var(--background-off-strong);
    border-radius: 2px;
    display: flex;
    flex-direction: row;
    align-items: center;
`
const StyledInfo = styled(Info)`
    margin-left: 4px;
    margin-right: 8px;
    height: 28px;
    width: 28px;
`

export const Alert: React.FC<{ text: string; style? }> = ({ text, style }) => {
    return (
        <ErrorBox style={style}>
            <StyledAlertOctagon />
            <span>{text}</span>
        </ErrorBox>
    )
}

export const InfoBox: React.FC<{ text: string; className?: string; onClick?: () => void }> = ({
    text,
    onClick,
    className
}) => {
    return (
        <InfoBoxWrapper onClick={onClick} className={className}>
            <StyledInfo />
            <span>{text}</span>
        </InfoBoxWrapper>
    )
}

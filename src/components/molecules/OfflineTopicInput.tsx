import { useState } from 'preact/hooks'
import { useOptions } from '../../hooks/useOptions'
import styled from 'styled-components'
import { Button } from '../atoms/Button'
import { Input } from '../atoms/Input'
import { useLocalized } from 'src/hooks/useLocalized'

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
`

const InputRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`

interface Props {
    disabled?: boolean
    className?: string
}

export const OfflineTopicInput: React.FC<Props> = ({ disabled }) => {
    const { t } = useLocalized()
    const { data: options, actions } = useOptions()
    const [newTopicName, setNewTopicName] = useState('')

    const addTopic = async () => {
        if (!newTopicName.trim()) return

        let id = 1
        while (options.issues[`T-${String(id).padStart(2, '0')}`] && id <= 10000) {
            id++
        }
        const key = `T-${String(id).padStart(2, '0')}`

        await actions.merge({
            issues: {
                ...options.issues,
                [key]: { id: key, key, name: newTopicName.trim(), alias: newTopicName.trim() }
            },
            issueOrder: [...options.issueOrder, key]
        })

        setNewTopicName('')
    }

    return (
        <Wrapper>
            <InputRow>
                <Input
                    style={{ flex: 1 }}
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder={t('placeholder.topicName')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addTopic()
                    }}
                    disabled={disabled}
                />
                <Button onClick={addTopic} disabled={disabled || !newTopicName.trim()}>
                    {t('action.addTopic')}
                </Button>
            </InputRow>
        </Wrapper>
    )
}

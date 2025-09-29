import { X } from 'preact-feather'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { Input } from '../atoms/Input'
import { Modal } from '../atoms/Modal'
import styled from 'styled-components'
import { H5, Label } from '../atoms/Typography'
import { ProgressIndeterminate } from '../atoms/Progress'
import { searchIssues } from '../../utils/api'
import { FlexRow } from '../atoms/Layout'
import { useLocalized } from 'src/hooks/useLocalized'

const SearchFieldWrapper = styled.div`
    width: 100%;
    padding: 8px 16px;
`
const SearchResultList = styled.ul`
    width: calc(100% - 16px);
    padding: 0px 8px;
    overflow: auto;
    margin: 0px 8px 8px;
    list-style: none;
`
const SearchResultItem = styled.li`
    display: flex;
    align-items: flex-start;
    padding: 3px 0 3px;
    line-height: 20px;
    border-bottom: solid 1px var(--contrast);
    color: var(--font);
    cursor: pointer;

    &:hover {
        background: var(--background-off-strong);
    }
    &:last-child {
        border-bottom: none;
    }

    > span:first-child {
        flex-shrink: 0;
        margin-right: 4px;
    }
`

interface Props {
    onSelect: (issue: Issue) => void
    onCancel: () => void
    title: string
}

export const IssueSearchDialog: React.FC<Props> = ({ onSelect, onCancel, title }) => {
    const { t } = useLocalized()
    const [result, setResult] = useState<{ isLoading: boolean; data?: Issue[] }>(null)
    const [search, setSearch] = useState('')
    const currentSearch = useRef(search)
    const searchInput = useRef(null)
    const searchTimeout = useRef(null)

    useEffect(() => {
        currentSearch.current = search
        if ((search.length && search.includes('-')) || search.length > 3) {
            clearTimeout(searchTimeout.current)
            setResult({ isLoading: true })
            searchTimeout.current = setTimeout(() => {
                searchIssues(search)
                    .then((issues) => {
                        if (search === currentSearch.current) {
                            setResult({
                                isLoading: false,
                                data: issues
                            })
                        }
                    })
                    .catch((e) => {
                        console.error(e)
                        if (search === currentSearch.current) {
                            setResult(null)
                        }
                    })
            }, 300)
        }
    }, [search])

    const submit = (issue) => {
        setSearch('')
        setResult(null)
        onSelect(issue)
    }

    useLayoutEffect(() => {
        searchInput.current?.focus()
    }, [])

    return (
        <Modal style={{ padding: 0, justifyContent: 'flex-start', width: 380, height: 430 }}>
            <FlexRow style={{ width: '100%' }}>
                <H5 style={{ padding: 8, margin: 0, fontSize: '1rem' }}>{title}</H5>
                <div style={{ marginLeft: 'auto', cursor: 'pointer', padding: 4 }} onClick={onCancel}>
                    <X style={{ color: 'var(--font)' }} size={18} />
                </div>
            </FlexRow>
            <SearchFieldWrapper>
                <Label>{t('dialog.issueSearch')}</Label>
                <Input ref={searchInput} style={{ width: '100%' }} value={search} onChange={(e) => setSearch(e.target.value || '')} />
                {result?.isLoading && <ProgressIndeterminate />}
            </SearchFieldWrapper>
            <SearchResultList>
                {!result?.isLoading &&
                    !!result?.data?.length &&
                    result.data
                        .sort((i1, i2) => {
                            if (search.toLowerCase().includes(i1.key.toLowerCase())) {
                                return -1
                            }
                            if (search.toLowerCase().includes(i2.key.toLowerCase())) {
                                return 1
                            }
                            return 0
                        })
                        .map((issue) => (
                            <SearchResultItem key={issue.key} onClick={() => submit(issue)}>
                                <span>{`${issue.key}:`}</span>
                                <span>{issue.name}</span>
                            </SearchResultItem>
                        ))}
            </SearchResultList>
        </Modal>
    )
}

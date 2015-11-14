import { usePersitentFetch } from "./usePersitedFetch"

import { fetchIssues } from "../utils/jira"
import { CACHE } from "../constants/constants"

export function useFetchJiraIssues() {
    return usePersitentFetch<'ISSUE_CACHE'>(() => fetchIssues(), CACHE.ISSUE_CACHE, [], 60)
}
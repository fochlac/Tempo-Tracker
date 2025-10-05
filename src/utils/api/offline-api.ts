import { DB } from '../data-layer'
import { DB_KEYS } from '../../constants/constants'
import { v4 as uuid } from 'uuid'

/**
 * Offline API implementation for local-only time tracking without Jira backend.
 * Stores worklogs in a separate OFFLINE_WORKLOGS slice to keep them distinct from
 * regular worklogs that may need syncing in the future.
 */

export async function fetchSelf(): Promise<Self> {
    // In offline mode, return a dummy user
    return {
        user: 'offline-user',
        displayName: 'Offline User',
        emailAddress: 'offline@local'
    }
}

export async function checkPermissions(): Promise<boolean> {
    // No permissions needed in offline mode
    return Promise.resolve(true)
}

export function getDomains(): string[] {
    // No domains needed in offline mode
    return []
}

export async function fetchIssues(): Promise<Issue[]> {
    // In offline mode, issues are managed locally in options
    return []
}

export async function searchIssues(): Promise<string[]> {
    // In offline mode, issues are managed locally in options
    return []
}

export async function fetchWorklogs(startDate: number, endDate: number): Promise<Worklog[]> {
    // Get offline worklogs from separate storage
    const offlineWorklogs = ((await DB.get(DB_KEYS.OFFLINE_WORKLOGS)) || []) as Worklog[]

    return offlineWorklogs.filter((log) => log.start >= startDate && log.start <= endDate)
}

export async function writeWorklog(worklog: Partial<Worklog>): Promise<Worklog> {
    const id = uuid()
    const newLog: Worklog = {
        id,
        start: worklog.start,
        end: worklog.end,
        issue: worklog.issue,
        comment: worklog.comment || '',
        synced: true
    }

    // Store in separate offline worklogs slice
    await DB.update(DB_KEYS.OFFLINE_WORKLOGS, (worklogs: Worklog[] = []) => {
        return [...worklogs, newLog]
    })

    return newLog
}

export async function updateWorklog(worklog: Partial<Worklog>): Promise<Worklog> {
    const updatedLog: Worklog = {
        id: worklog.id,
        start: worklog.start,
        end: worklog.end,
        issue: worklog.issue,
        comment: worklog.comment || '',
        synced: true
    }

    // Update in offline worklogs slice
    await DB.update(DB_KEYS.OFFLINE_WORKLOGS, (worklogs: Worklog[] = []) => {
        const index = worklogs.findIndex((log) => log.id === worklog.id)
        if (index >= 0) {
            worklogs[index] = updatedLog
        }
        return worklogs
    })

    return updatedLog
}

export async function deleteWorklog(id: string): Promise<void> {
    // Remove from offline worklogs slice
    await DB.update(DB_KEYS.OFFLINE_WORKLOGS, (worklogs: Worklog[] = []) => {
        return worklogs.filter((log) => log.id !== id)
    })
}

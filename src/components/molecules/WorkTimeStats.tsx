
import styled from "styled-components"
import {  formatDuration } from "../../utils/datetime"
import { Block, Column } from "../atoms/Layout"
import { Label, Value } from "../atoms/Typography"

interface Props {
    stats: StatsMap;
    getRequiredSeconds: (week: number) => number;
}

export const WorkTimeStats: React.FC<Props> = ({stats, getRequiredSeconds}) => {
    const requiredSeconds = Object.keys(stats?.weeks || {}).reduce((requiredSeconds, week) => {
        return requiredSeconds + getRequiredSeconds(Number(week))
    }, 0)
    const overseconds = stats ? stats.total - requiredSeconds : 0
    const sortedHours = Object.values(stats?.weeks || {'0': 0}).sort((a, b) => a - b)
    const medianHours = sortedHours.length % 2 
        ? sortedHours[sortedHours.length / 2 - 0.5] 
        : (sortedHours[sortedHours.length / 2 - 1] + sortedHours[sortedHours.length / 2]) / 2 

    return (
        <Block>
            <Column>
                <Label>Total Hours</Label>
                <Value>{stats ? formatDuration(stats.total * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>Required Hours</Label>
                <Value>{stats ? formatDuration(requiredSeconds * 1000, true, true) : <>&mdash;</>}</Value>
            </Column>
            <Column>
                <Label>Overhours</Label>
                <Value>
                    {overseconds > 0 ? formatDuration(overseconds * 1000, true, true) : <>&mdash;</>}
                </Value>
            </Column>
            <Column>
                <Label>Median Hours (Week)</Label>
                <Value>
                    {stats ? formatDuration(medianHours * 1000, true, true) : <>&mdash;</>}
                </Value>
            </Column>
        </Block>
    )
}
import styled from "styled-components";

const RangeInput = styled.input`
    position: absolute;
    width: 210px;
    height: 30px;
    overflow: hidden;
    cursor: pointer;
    outline: none;
    -webkit-appearance: none;
    background: none;
    pointer-events: none;

    &::-moz-range-track,
    &::-webkit-slider-runnable-track {
        width: 200px;
        height: 1px;
        background: #003D7C;
        pointer-events: none;
    }

    &:nth-child(2)::-webkit-slider-runnable-track,
    &:nth-child(2)::-moz-range-track {
        background: none;
    }
    
    &::-moz-range-thumb,
    &::-webkit-slider-thumb {
        position: relative;
        height: 15px;
        width: 15px;
        margin-top: -7px;
        background: #fff;
        border: 1px solid #003D7C;
        border-radius: 25px;
        z-index: 1;
        pointer-events: all;
    }

    &:nth-child(1)::-moz-range-thumb,
    &:nth-child(1)::-webkit-slider-thumb {
        z-index: 2;
    }
`

const Wrapper = styled.div`
    position: relative;
    height: 26px;
    width: 210px;
    margin-top: -5px;
`
interface Props {
    onChange(value: [number, number]): void;
    value: [number, number];
    max: number;
}

export const DualRangeSlider: React.FC<Props> = ({ onChange, value, max }) => {
    const handleChange = (idx: (0 | 1)): React.ChangeEventHandler<HTMLInputElement> => (e) => {
        const newValue = value.slice() as Props['value'];
        newValue[idx] = Number(e.target.value)
        onChange(newValue.sort((a, b) => a - b))
    }

    return <Wrapper>
        <RangeInput type="range" max={max} value={value[0]} onChange={handleChange(0)} />
        <RangeInput type="range" max={max} value={value[1]} onChange={handleChange(1)} />
    </Wrapper>
}
export const template = `
<style>
    .tempo_tracker-overlay {
        color: black;
        position: fixed;
        min-width: 220px;
        height: 33px;
        box-sizing: border-box;
        padding: 4px 4px 4px 16px;
        background: white;
        border: solid 1px darkgray;
        border-radius: 4px;
        z-index: 100000000;
        font-size: 16px;
        font-family: serif;
        opacity: 0.6;
        transition: opacity 5s cubic-bezier(1, 0, 1, 0);
    }
    .tempo_tracker-overlay:hover {
        transition: none;
        opacity: 1;
    }
    .tempo_tracker-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
    }
    select[class].tempo_tracker-issue {   
        color: black;
        font-size: 15px;
        font-family: sans-serif;
        font-weight: 500;
        background: white;
        outline: none;
        border: none;
        padding: 0;
        -webkit-appearance: auto;
        width: auto;
        height: auto;
        margin: 0;
    }
    .tempo_tracker-time {
        color: black;
        cursor: default;
        font-size: 16px;
        font-family: sans-serif;
        font-weight: 500;
        line-height: 16px;
        pointer-events: none;
        height: 16px;
    }
    .tempo_tracker-handle:active {
        cursor: grabbing;
    }
    .tempo_tracker-handle {
        position: absolute;
        left: 1px;
        top: 0;
        font-size: 20px;
        font-weight: 700;
        line-height: 20px;
        color: grey;
        letter-spacing: -2px;
        font-family: serif;
        height: 100%;
        padding-top: 3px;
        cursor: grab;
        user-select: none;
    }
    .tempo_tracker-btn.start {
        border: 1px solid #2a52be;
        background-color: #5575cb;
    }
    .tempo_tracker-btn.start:hover {
        border-color: #11214c;
        background-color: #3f63c5;
    }
    .tempo_tracker-btn.start:active {
        background-color: #6a86d2;
        border-color: #2a52be;
    }
    .tempo_tracker-btn.stop {
        background: #f32121;
        border-color: #aa1717;
    }
    .tempo_tracker-btn.stop:hover {
        background: #de0c0c;
        border-color: #820707;
    }
    .tempo_tracker-btn.stop:active {
        background: #ff4b2e;
        border-color: #aa1717;
    }
    button[class].tempo_tracker-btn {
        font-size: 14px;
        line-height: 14px;
        font-family: sans-serif;
        padding: 3px 8px;
        color: #fff;
        font-weight: 700;
        border-radius: 3px;
        cursor: pointer;
        border: solid 1px;
        -webkit-appearance: auto;
        width: auto;
        height: 100%;
        margin: 0;
        margin-left: 4px;
    }
</style>
<div class="tempo_tracker-box">
    <span class="tempo_tracker-handle">:|</span>
    <select class="tempo_tracker-issue"></select>
    <span class="tempo_tracker-time">00:00:00</span>
    <button class="tempo_tracker-btn start">Start</button>
</div>
`
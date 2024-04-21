export const syncTemplate = `
<style>
    .tempo_tracker_sync-overlay {
        color: black;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        box-sizing: border-box;
        background: white;
        z-index: 100000000;
        font-size: 16px;
        font-family: serif;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .tempo_tracker_sync-box {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .tempo_tracker_sync-progress {
        text-align: center;
        font-size: 1.2rem;
    }
    .tempo_tracker_sync-bar {
        width: 200px;
        height: 16px;
    }
</style>
<div class="tempo_tracker_sync-box">
    <p class="tempo_tracker_sync-progress"></p>
    <progress class="tempo_tracker_sync-bar" max="100"></progress>
</div>
`

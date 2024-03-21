[Chrome Extension](https://chrome.google.com/webstore/detail/tempo-tracker/gcicdbcmacjeaepmfkibdbhickbdiafj)
[Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/tempo-tracker/)

## Build

 1) `npm i`
 2) `npm run build` for prod build or `npm run start` for dev build

## Release

Releases are done via the following commands:
|Release type|Command|
|---|---|
|patch| `npm run patch`|
|minor| `npm run minor`|
|major| `npm run major`|

## Tests

To run the cypress tests first run `npm run test:server`, then `npm run cypress:open`.
Or use the shortcut `npm run test:open`.

## CI
https://app.circleci.com/pipelines/github/fochlac/Tempo-Tracker
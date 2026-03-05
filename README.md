[Chrome Extension](https://chromewebstore.google.com/detail/tempo-tracker/gcicdbcmacjeaepmfkibdbhickbdiafj)
[Edge Extension](https://microsoftedge.microsoft.com/addons/detail/tempotracker/bagmlbondklkiomfpeicbgmnbibadbck)
[Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/tempo-tracker/)

## Build

1.  `npm i`
2.  `npm run build` for prod build or `npm run start` for dev build

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

## Import / Export

- Export includes both general app options and statistics options.
- Statistics options include work-time override periods and overhour correction events.
- Legacy import files without `statsOptions` still work; missing statistics fields are reset to defaults.
- Overhour corrections are applied only to statistic windows that include each correction date.

## CI

https://app.circleci.com/pipelines/github/fochlac/Tempo-Tracker

const express = require('express')
const { readFile } = require('fs/promises')
const path = require('path')
const app = express()

const chromeApiMock = `
    chrome = {
        badge: {},
        menus: [],
        tabsList: [],
        messages: [],
        alarmList: [],
        alarmListeners: [],
        menuListeners: [],
        messageListeners: [],
        installListeners: [],
        commandListeners: [],
        origins: [],
        permissions: {
            getAll: () => ({ origins: chrome.origins }),
            request: ({ origins }) => {
                chrome.origins.push(...origins)
                return Promise.resolve(true)
            },
            contains: (options, cb) => cb(true)
        },
        alarms: {
          create: (name, settings) => chrome.alarmList.push({name, settings}),
          onAlarm: {
            addListener: (alarm) => chrome.alarmListeners.push(alarm)
          },
          clearAll: (cb) => {
            chrome.alarmList = []
            typeof cb === 'function' && cb()
          }
        },
        commands: {
            onCommand: {
                addListener: (commandCb) => chrome.commandListeners.push(commandCb)
            }
        },
        tabs: {
            create: (options) => chrome.tabsList.push(options)
        },
        runtime: {
            sendMessage: (message, callback) => { chrome.messages.push({message, callback}) },
            onMessage:{
              addListener: (alarm) => chrome.messageListeners.push(alarm)
            },
            onInstalled: {
                addListener: (alarm) => chrome.installListeners.push(alarm)
            }
        },
        action: {
            setBadgeBackgroundColor: ({color}) => {chrome.badge.backgroundColor = color},
            setBadgeText: ({text}) => {chrome.badge.text = text},
            setTitle: ({title}) => {chrome.badge.title = title}
        },
        contextMenus: {
            create: (menu) => chrome.menus.push(menu),
            onClicked: {
                addListener: (listener) => chrome.menuListeners.push(listener)
            }
        }
    };
`

app.get('/sw.js', async (req, res) => {
    const swContent = await readFile(path.join(__dirname, '../dist/sw.js'), {encoding: 'utf8'})
    res.setHeader('content-type', 'application/javascript')
    res.status(200).send(`${chromeApiMock}\n${swContent}`)
})

app.use('/', express.static(path.join(__dirname, '../dist')))

app.get('/', (req, res) => res.status(200).send(`
    <!doctype html>
    <html>
        <head>
            <script>
                ${chromeApiMock}
            </script>
            <title>Tempo Tracker</title>
            <link rel="stylesheet" type="text/css" href="./popup.css">
        </head>
        <body>
            <div class="root"></div>
            <div class="modal"></div>
        </body>
    </html>
`))

app.listen(3000, () => {
    console.log('Listening on: http://localhost:3000/')
})

const express = require('express')
const { readFile } = require('fs/promises')
const path = require('path')
const app = express()

const chromeApiMock = `
    chrome = {
        badge: {},
        menus: [],
        alarmList: [],
        alarmListeners: [],
        menuListeners: [],
        messageListeners: [],
        alarms: {
          create: (settings) => chrome.alarmList.push(settings),
          onAlarm: {
            addListener: (alarm) => chrome.alarmListeners.push(alarm)
          }
        },
        tabs: {
            create: Function.prototype
        },
        runtime: {
            sendMessage: Function.prototype,
            onMessage:{
              addListener: (alarm) => chrome.messageListeners.push(alarm)
            }
        },
        action: {
            setBadgeBackgroundColor: (color) => {chrome.badge.backgroundColor = color},
            setBadgeText: (text) => {chrome.badge.text = text},
            setTitle: (title) => {chrome.badge.title = title}
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
                const registerServiceWorker = async () => {
                    if ("serviceWorker" in navigator) {
                      try {
                        const registration = await navigator.serviceWorker.register("/sw.js", {
                          scope: "/",
                        });
                        if (registration.installing) {
                          console.log("Service worker installing");
                        } else if (registration.waiting) {
                          console.log("Service worker installed");
                        } else if (registration.active) {
                          console.log("Service worker active");
                        }
                      } catch (error) {
                        console.error(\`Registration failed with \${error}\`);
                      }
                    }
                  }
                  registerServiceWorker()
            </script>
            <title>Tempo Tracker</title>
            <link rel="stylesheet" type="text/css" href="./popup.css">
        </head>
        <body>
            <div class="modal"></div>
        </body>
        <script src="popup.js"></script>
    </html>
`))

app.listen(3000, () => {
    console.log('Listening on: http://localhost:3000/')
})
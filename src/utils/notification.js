const browser = require("webextension-polyfill");

export const createNotification = (config) =>
  browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/512x512.png'),
    ...config
  })

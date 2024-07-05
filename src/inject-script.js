console.log("TACA ===> start inject-script.js")
window.yaswap = 'abc'
console.log("TACA ===> start inject-script.js, window.yaswap = ", window.yaswap)

window.addEventListener(
    'message',
    (event) => {
      console.log("TACA ===> inject-script.js, event = ", event)
      if (event.source !== window) return
      if (!event.data) return

      const { type, data } = event.data
      if (type !== 'setup' || !data) return

      window.yaswap = data;
      console.log("TACA ===> inject-script.js, window.yaswap = ", window.yaswap)
    },
    false
  )
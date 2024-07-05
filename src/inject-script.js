window.yaswap = 'abc'

window.addEventListener(
    'message',
    (event) => {
      if (event.source !== window) return
      if (!event.data) return

      const { type, data } = event.data
      if (type !== 'setup' || !data) return

      window.yaswap = data;
    },
    false
  )
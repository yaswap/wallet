import { CUSTOM_ERRORS, createInternalError } from '@yaswap/error-parser'

class PageProvider {
  window
  constructor(window) {
    this.window = window
  }
  setup() {
    throw createInternalError(CUSTOM_ERRORS.Unimplemented.Method)
  }
}

export { PageProvider }

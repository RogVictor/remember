import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') {
      return { url: 'data:text/javascript,export%20%7B%7D', shortCircuit: true }
    }

    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      context.parentURL?.startsWith('file:') &&
      !context.parentURL.includes('/node_modules/')
    ) {
      for (const extension of ['.ts', '.tsx', '.js', '.mjs']) {
        try {
          return nextResolve(specifier + extension, context)
        } catch (error) {
          if (!['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(error.code)) {
            throw error
          }
        }
      }
    }

    return nextResolve(specifier, context)
  },
})

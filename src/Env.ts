import { EnvError } from './EnvError'
import { Options } from './declarations'
import isIP from 'validator/es/lib/isIP'
import isURL from 'validator/es/lib/isURL'
import isEmail from 'validator/es/lib/isEmail'
import isNumeric from 'validator/es/lib/isNumeric'

/**
 * Env module to manage environment variables.
 */
let envCache: Record<string, any> = {}

/**
 * Get the specified env variable value.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value of the environment variable.
 */
export function get<T> (key: string, options?: Options | any): T {
  if (options === undefined) return getString(key) as T
  if (typeof options === 'function') return custom(key, options)

  const typeHandlers: Record<string, (key: string, options?: Options) => any> = {
    number: getNumber,
    boolean: getBoolean,
    array: getArray,
    object: getObject,
    json: getJson,
    enum: getEnum,
    email: getEmail,
    host: getHost,
    url: getUrl,
    string: getString
  }

  return (typeHandlers[options.type] ?? getString)(key, options)
}

/**
 * Get the specified env variable value as a string.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a string.
 */
export function getString (key: string, options?: Options | string): string {
  return custom(
    key,
    (key, value, opts) => {
      switch (opts.format) {
        case 'url':
          return getUrl(key, opts)
        case 'host':
          return getHost(key, opts)
        case 'email':
          return getEmail(key, opts)
        default:
          return value !== undefined ? String(value) : opts.default
      }
    },
    options
  )
}

/**
 * Get the specified env variable value as a number.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a number.
 */
export function getNumber (key: string, options?: Options): number {
  return custom(
    key,
    (key: string, value: string, opts) => {
      if (value !== undefined && !isNumeric(value)) {
        throw new EnvError(`Value for ${key} must be a valid number, received: ${value}`)
      }

      return Number(value ?? opts.default)
    },
    options
  )
}

/**
 * Get the specified env variable value as a boolean.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a boolean.
 */
export function getBoolean (key: string, options?: Options): boolean {
  return custom(
    key,
    (key: string, value: string, opts) => {
      if (value !== undefined && !['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
        throw new EnvError(`Value for ${key} must be a valid boolean, received: ${value}`)
      }

      return ['true', '1'].includes(String(value).toLowerCase())
    },
    options
  )
}

/**
 * Get the specified env variable value as an array.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as an array of strings.
 */
export function getArray (key: string, options?: Options): string[] {
  return custom(
    key,
    (key, value, opts) => {
      value = value !== undefined
        ? value
          .split(opts.separator ?? ',')
          .map((v: string) => v.trim())
        : null

      return value ?? opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value as an object.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as an object.
 */
export function getObject (key: string, options?: Options): Record<string, any> {
  return custom(
    key,
    (key, value, opts) => {
      value = value !== undefined
        ? Object.fromEntries(
          value.split(opts.separator ?? ',').map((v: string) => {
            const [k, w] = v.split(':').map((w: string) => w.trim())
            let parsedValue: string | number | boolean = w
            if (isNumeric(w)) parsedValue = Number(w)
            if (['true', 'false', '1', '0'].includes(w.toLowerCase())) parsedValue = ['true', '1'].includes(w.toLowerCase())
            return [k, parsedValue]
          })
        )
        : null

      return value ?? opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value as JSON.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a JSON object.
 */
export function getJson (key: string, options?: Options): unknown {
  return custom(
    key,
    (key, value, opts) => {
      try {
        return JSON.parse(value)
      } catch (e: any) {
        if (opts.optional === false) {
          throw new EnvError(`Value for ${key} must be valid JSON. Error: ${e.message as string}`)
        }
        return opts.default
      }
    },
    options
  )
}

/**
 * Get the specified env variable value as an enum.
 *
 * @param key - The environment variable key.
 * @param enums - Array of possible enum values or options.
 * @param defaultValue - Default value if not set.
 * @param options - Options for retrieving the value.
 * @returns The value as an enum.
 */
export function getEnum (key: string, enums: string[] | Options = [], defaultValue?: string, options?: Options): string {
  options = options ?? {}

  if (Array.isArray(enums)) {
    options.enums = enums
    options.default = defaultValue
    options.optional = defaultValue !== undefined
  } else if (typeof enums === 'object') {
    options = enums
  }

  options.enums ??= []

  return custom(
    key,
    (key, value: string, opts) => {
      if (opts.optional === false && (value === undefined || opts.enums === undefined || !(opts.enums?.includes(value)))) {
        throw new EnvError(`Value for ${key} must be one of: ${String(opts.enums)}. Received: ${value}`)
      }

      return value ?? opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value as an email.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as an email.
 */
export function getEmail (key: string, options?: Options): string {
  return custom(
    key,
    (key, value: string, opts) => {
      if (value !== undefined && !isEmail(value, { require_tld: opts.tld ?? true })) {
        throw new EnvError(`Value for ${key} must be a valid email address. Received: ${value}`)
      }

      return value !== undefined ? String(value) : opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value as a URL.
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a URL.
 */
export function getUrl (key: string, options?: Options): string {
  return custom(
    key,
    (key, value: string, opts) => {
      if (value !== undefined && !isURL(value, { require_tld: opts.tld ?? true, require_protocol: opts.protocol ?? true })) {
        throw new EnvError(`Value for ${key} must be a valid URL. Received: ${value}`)
      }

      return value !== undefined ? String(value) : opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value as a host (IP or URL).
 *
 * @param key - The environment variable key.
 * @param options - Options for retrieving the value.
 * @returns The value as a host.
 */
export function getHost (key: string, options?: Options): string {
  return custom(
    key,
    (key, value: string, opts) => {
      if (
        value !== undefined &&
        (!isIP(value, opts.version ?? 4) &&
          !isURL(value, { require_tld: opts.tld ?? true, require_protocol: opts.protocol ?? true }))
      ) {
        throw new EnvError(`Value for ${key} must be a valid host (URL or IP). Received: ${value}`)
      }

      return value !== undefined ? String(value) : opts.default
    },
    options
  )
}

/**
 * Get the specified env variable value with custom validator.
 *
 * @param key - The environment variable key.
 * @param validator - The custom validation function.
 * @param options - Options for retrieving the value.
 * @returns The validated value of the environment variable.
 */
export function custom (key: string, validator: (key: string, value: any, options: Options) => any, options?: Options | any): any {
  const cachedValue = envCache[key]

  if (cachedValue !== undefined) {
    return cachedValue
  }

  const value = getEnv(key)

  options = normalizeOptions(options)

  if (options.optional === false && isEmpty(value)) {
    throw new EnvError(`Value for ${key} is required.`)
  }

  const validatedValue = validator(key, value, options)

  if (validatedValue !== options.default) {
    envCache[key] = validatedValue
  }

  return validatedValue
}

/**
 * Get system env variables.
 * For Node.js environment get variables from process.env at runtime.
 * For Browser environment get variables from .env at buildtime.
 *
 * @param key - The environment variable key.
 * @returns The value of the environment variable.
 */
export function getEnv (key: string): string | undefined {
  return isBrowser() ? (window as any).__stone_env__[key] : process.env[key]
}

/**
 * Determine if the current environment matches the given value.
 *
 * @param env - The environment to check.
 * @returns True if the current environment matches the given value, otherwise false.
 */
export function is (env: string): boolean {
  return getEnv('NODE_ENV') === env
}

/**
 * Determine if the current environment is production.
 *
 * @returns True if in a production environment, otherwise false.
 */
export function isProduction (): boolean {
  return is('production') || is('prod')
}

/**
 * Determine if the current environment is not production.
 *
 * @returns True if not in a production environment, otherwise false.
 */
export function isNotProduction (): boolean {
  return !isProduction()
}

/**
 * Determine if the current environment is prod.
 *
 * @returns True if in a prod environment, otherwise false.
 */
export function isProd (): boolean {
  return isProduction()
}

/**
 * Determine if the current environment is not prod.
 *
 * @returns True if not in a prod environment, otherwise false.
 */
export function isNotProd (): boolean {
  return isNotProduction()
}

/**
 * Determine if the current environment is testing.
 *
 * @returns True if in a testing environment, otherwise false.
 */
export function isTesting (): boolean {
  return is('test') || is('testing')
}

/**
 * Clear the environment variable cache.
 *
 * @returns The Env class.
 */
export function clearCache (): void {
  envCache = {}
}

/**
 * Determine if the current environment is a browser.
 *
 * @returns True if in a browser environment, otherwise false.
 */
function isBrowser (): boolean {
  return typeof window === 'object'
}

/**
 * Normalize options.
 *
 * @param options - The options to normalize.
 * @returns The normalized options.
 */
function normalizeOptions (options?: Options | any): Options {
  if (options === undefined || Array.isArray(options) || typeof options !== 'object') {
    options = { default: options }
  }

  options.optional ??= options.default !== undefined
  options.default ??= null

  return options
}

/**
 * Check if a value is empty.
 *
 * @param value - The value to check.
 * @returns True if the value is empty, otherwise false.
 */
function isEmpty (value: any): boolean {
  if (value === undefined || value === null) return true
  // if (Array.isArray(value) && value.length === 0) return true
  // if (typeof value === 'object' && Object.keys(value).length === 0) return true
  if (typeof value === 'string' && value.trim().length === 0) return true

  return false
}

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import isIP from 'validator/lib/isIP.js'
import isURL from 'validator/lib/isURL.js'
import isEmail from 'validator/lib/isEmail.js'
import isBoolean from 'validator/lib/isBoolean.js'
import isNumeric from 'validator/lib/isNumeric.js'
import { EnvException } from "./exceptions/EnvException.mjs"

export class Env {
  static #envCache = {}
  static #loaded = false
  
  static get (key, options) {
    if (!options) { return this.string(key, options) }
    if (typeof options === 'function') { return this.custom(key, options, null) }

    switch(options.type) {
      case 'number':
        return this.number(key, options)
      case 'boolean':
        return this.boolean(key, options)
      case 'array':
        return this.array(key, options)
      case 'object':
        return this.object(key, options)
      case 'json':
        return this.json(key, options)
      case 'enum':
        return this.enum(key, options)
      case 'email':
        return this.email(key, options)
      case 'host':
        return this.host(key, options)
      case 'url':
        return this.url(key, options)
      default:
        return this.string(key, options)
    }
  }

  static string (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        switch (opts.format) {
          case 'url':
            return this.url(key, opts).value()
          case 'host':
            return this.host(key, opts).value()
          case 'email':
            return this.email(key, opts).value()
          default:
            return value ? String(value) : opts.default
        }
      },
      options
    )
  }

  static number (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (value && !isNumeric(value)) {
          throw new EnvException(`Value for ${key} must be a valid number.`)
        }

        return Number(value ?? opts.default)
      },
      options
    )
  }

  static boolean (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (value && !isBoolean(value)) {
          throw new EnvException(`Value for ${key} must be a valid boolean.`)
        }

        return Boolean(value ?? opts.default)
      },
      options
    )
  }

  static array (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        value = value
          ? value
            .split(opts.separator ?? ',')
            .map(v => v.trim())
          : null

        if (!opts.optional && (!value || value.length === 0)) {
          throw new EnvException(`Value for ${key} must not be an empty array.`)
        }

        return value ?? opts.default
      },
      options
    )
  }

  static object (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        value = value
          ? Object.fromEntries(
            value
              .split(opts.separator ?? ',')
              .map(v => {
                return v
                  .split(':')
                  .map(w => {
                    w = w.trim()
                    if (isNumeric(w)) { return Number(w) }
                    if (isBoolean(w)) { return Boolean(w) }
                    return w
                  })
              })
          )
          : null

        if (!opts.optional && (!value || Object.keys(value).length === 0)) {
          throw new EnvException(`Value for ${key} must not be an empty object.`)
        }

        return value ?? opts.default
      },
      options
    )
  }

  static json (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        try {
          return JSON.parse(value)
        } catch (e) {
          if (!opts.optional) {
            throw new EnvException(`Value for ${key} must be valid json.`, e)
          }
          return opts.default
        }
      },
      options
    )
  }

  static enum (key, enums = [], defaultValue = null, options) {
    options = options ?? {}

    if (Array.isArray(enums)) {
      options.enums = enums
      options.default = defaultValue
      options.optional = true
    } else if (typeof enums === 'object') {
      options = enums
    }

    options.enums ??= []

    return this.custom(
      key,
      (key, value, opts) => {
        if (!opts.optional && (!value || !opts.enums.includes(value))) {
          throw new EnvException(`Value for ${key} must be valid enum(${opts.enums.join(',')})`)
        }

        return value ?? opts.default
      },
      options
    )
  }

  static email (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (value && !isEmail(value, { require_tld: opts.tld ?? true })) {
          throw new EnvException(`Value for ${key} must be a valid email address.`)
        }

        return value ? String(value) : opts.default
      },
      options
    )
  }

  static url (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (value && !isURL(value, { require_tld: opts.tld ?? true, require_protocol: opts.protocol ?? true })) {
          throw new EnvException(`Value for ${key} must be a valid url`)
        }
        
        return value ? String(value) : opts.default
      },
      options
    )
  }

  static host (key, options) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (
          value &&
          !isIP(value, Number(opts.version ?? 4)) ||
          !isURL(value, { require_tld: opts.tld ?? true, require_protocol: opts.protocol ?? true })
        ) {
          throw new EnvException(`Value for ${key} must be a valid host (url or ip).`)
        }
        
        return value ? String(value) : opts.default
      },
      options
    )
  }

  static custom (key, validator, options) {
    if (this.#envCache[key]) {
      return {
        value: () => this.#envCache[key],
        toString: () => this.#envCache[key],
      }
    }

    const self = this
    const value = this.env(key)

    options = this.#normalizeOptions(options)

    if (!options.optional && this.#isEmpty(value)) {
      throw new EnvException(`Value for ${key} is required.`)
    }
    
    return {
      toString () {
        return this.value()
      },
      value () {
        const validatedValue = this.validate()
        if (validatedValue !== options.default) { self.#envCache[key] = validatedValue }
        return validatedValue
      },
      validate: () => validator(key, value, options),
    }
  }

  static is (env) {
    return this.env('NODE_ENV') === env
  }

  static isProduction () {
    return this.is('prod') || this.is('production')
  }

  static isNotProduction () {
    return !this.isProduction()
  }

  static isTesting () {
    return this.is('test') || this.is('testing')
  }

  static clearCache () {
    this.#envCache = {}
    this.#loaded = false

    return this
  }

  static env (key) {
    this.#load()
    return process.env[key]
  }

  static #load (force = false) {
    if (force || !this.#loaded) {
      const result = dotenv.config({ debug: process.env.DEBUG })

      if (result.error) {
        throw new EnvException(result.error.message, result.error)
      }

      dotenvExpand.expand(result)

      this.#loaded = true
    }

    return this
  }

  static #normalizeOptions (options) {
    if (
      !options ||
      Array.isArray(options) ||
      typeof options !== 'object'
    ) {
      options = { default: options }
    }

    options.optional ??= options.default !== undefined
    options.default ??= null

    return options
  }

  static #isEmpty (value) {
    if (!value) { return true }
    if (Array.isArray(value) && value.length === 0) { return true }
    if (typeof value === 'object' && Object.keys(value).length === 0) { return true }
    if (typeof value === 'string' && value.trim().length === 0) { return true }

    return false
  }
}
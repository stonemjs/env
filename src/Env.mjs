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
  
  static get (key, options = null) {
    if (typeof options === 'function') {
      return this.custom(key, options)
    } else if (
      !options ||
      Array.isArray(options) ||
      typeof options !== 'object') {
      options = { default: options, optional: true }
    }

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
      default:
        return this.string(key, options)
    }
  }

  static string (key, options = null) {
    return this.custom(
      key,
      (key, value, opts) => {
        if (opts.format === 'url') { return this.url(key, opts) }
        if (opts.format === 'host') { return this.host(key, opts) }
        if (opts.format === 'email') { return this.email(key, opts) }

        return value ? String(value) : opts.default
      },
      options
    )
  }

  static number (key, options = null) {
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

  static boolean (key, options = null) {
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

  static array (key, options = null) {
    return this.custom(
      key,
      (key, value, opts) => {
        value = (value ?? '').split(opts.separator ?? ',').map(v => v.trim())

        if (!opts.optional && value.length === 0) {
          throw new EnvException(`Value for ${key} must be an empty array.`)
        }

        return value.length === 0 ? opts.default : value
      },
      options
    )
  }

  static object (key, options = null) {
    return this.custom(
      key,
      (key, value, opts) => {
        value = Object.fromEntries((value ?? '').split(opts.separator ?? ',').map(v => v.split(':').map(v => v.trim())))

        if (!opts.optional && value.length === 0) {
          throw new EnvException(`Value for ${key} must be an empty array.`)
        }

        return value.length === 0 ? opts.default : value
      },
      options
    )
  }

  static json (key, options = null) {
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

  static enum (key, enums = [], defaultValue = null, options = null) {
    options = options ?? {}
    if (Array.isArray(enums)) {
      options.enums = enums
      options.default = defaultValue
      options.optional = true
    } else if (typeof enums === 'object' && !Array.isArray(enums)) {
      options = enums
    }

    return this.custom(
      key,
      (key, value, opts) => {
        if (value && !opts.optional && !opts.enums.includes(value)) {
          throw new EnvException(`Value for ${key} must be one of thoses values: ${opts.enums.join(',')}`)
        }

        return value?.length === 0 ? opts.default : value
      },
      options
    )
  }

  static email (key, options = null) {
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

  static url (key, options = null) {
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

  static host (key, options = null) {
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

  static custom (key, validator, options = null) {
    if (this.#envCache[key]) {
      return {
        value: () => this.#envCache[key],
        toString: () => this.#envCache[key],
      }
    }

    const self = this
    const value = this.env(key)

    options = this.#normalizeOptions(options)

    if (!options.optional && (!value || value.trim().length === 0)) {
      throw new EnvException(`Value for ${key} is required.`)
    }
    
    return {
      toString () {
        return this.value()
      },
      value () {
        const value = this.validate()
        if (value !== options.default) {
          self.#envCache[key] = this.validate()
        }
        return value
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
      typeof options !== 'object') {
      return { default: options ?? null, optional: true }
    }

    return options
  }
}
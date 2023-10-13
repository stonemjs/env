import { Env } from '../../src/index.mjs'

// Get env as string
console.log('APP_NAME from Get API: ', `${Env.get('APP_NAME')}`)
console.log('APP_NAME from String API: ', `${Env.string('APP_NAME')}`)
console.log('APP_ALIAS from Get API with default: ', Env.get('APP_ALIAS', 'StoneJS_ALIAS_A'))
console.log('APP_ALIAS from String API with default: ', Env.string('APP_ALIAS', 'StoneJS_ALIAS_B'))

// Get env as email
console.log('APP_EMAIL from Get API: ', `${Env.get('APP_EMAIL', { type: 'email' })}`)
console.log('APP_EMAIL from Email API: ', `${Env.email('APP_EMAIL')}`)
console.log('APP_EMAIL from String format API: ', `${Env.string('APP_EMAIL', { format: 'email' })}`)
console.log('APP_EMAIL_OLD from Get API with default: ', Env.get('APP_EMAIL_OLD', { type: 'email', default: 'default_email@stonejs.com' }))
console.log('APP_EMAIL_OLD from Email API with default: ', Env.email('APP_EMAIL_OLD', 'default_email@stonejs.com'))
console.log('APP_EMAIL_OLD from String format API with default:: ', Env.string('APP_EMAIL_OLD', { format: 'email', default: 'default_email@stonejs.com' }))
try {
  console.log('APP_EMAIL from Email API: ', `${Env.email('APP_EMAILS')}`)
} catch (error) {
  console.error('APP_EMAIL from Email API Error:', error.message)
}

// Get env as number
console.log('APP_ID from Get API: ', Env.get('APP_ID', { type: 'number' }))
console.log('APP_ID from Number API: ', Env.number('APP_ID'))
console.log('APP_UUID from Get API with default: ', Env.get('APP_UUID', 5555))
console.log('APP_UUID from Number API with default: ', Env.number('APP_UUID', 4444))

// Get env as boolean
console.log('APP_DEBUG from Get API: ', Env.get('APP_DEBUG', { type: 'boolean' }))
console.log('APP_DEBUG from Boolean API: ', Env.boolean('APP_DEBUG'))
console.log('APP_DEBUG_OLD from Get API with default: ', Env.get('APP_DEBUG_OLD', true))
console.log('APP_DEBUG_OLD from Boolean API with default: ', Env.boolean('APP_DEBUG_OLD', false))

// Get env as array
console.log('APP_ENVS from Get API: ', Env.get('APP_ENVS', { type: 'array' }))
console.log('APP_ENVS from Array API: ', Env.array('APP_ENVS'))
console.log('APP_ENVS_OLD from Get API with default: ', Env.get('APP_ENVS_OLD', []))
console.log('APP_ENVS_OLD from Array API with default: ', Env.array('APP_ENVS_OLD', []))

// Get env as object
console.log('APP_CONTEXT from Get API: ', Env.get('APP_CONTEXT', { type: 'object' }))
console.log('APP_CONTEXT from Object API: ', Env.object('APP_CONTEXT'))
console.log('APP_CONTEXT_OLD from Get API with default: ', Env.get('APP_CONTEXT_OLD', { type: 'object', default: {}, optional: true }))
console.log('APP_CONTEXT_OLD from Object API with default: ', Env.object('APP_CONTEXT_OLD', { default: {}, optional: true }))

// Get env as json
console.log('APP_METADATA from Get API: ', Env.get('APP_METADATA', { type: 'json' }))
console.log('APP_METADATA from Json API: ', Env.json('APP_METADATA'))
console.log('APP_METADATA_OLD from Get API with default: ', Env.get('APP_METADATA_OLD', { type: 'json', default: {}, optional: true }))
console.log('APP_METADATA_OLD from Json API with default: ', Env.json('APP_METADATA_OLD', { default: {}, optional: true }))

// Get env as enum
console.log('NODE_ENV from Get API: ', Env.get('NODE_ENV', { type: 'enum', enums: ['dev', 'prod', 'local'] }))
console.log('NODE_ENV from Enum API: ', Env.enum('NODE_ENV', ['dev', 'prod', 'local']))
console.log('NODE_ENV_OLD from Get API with default: ', Env.get('NODE_ENV_OLD', { type: 'enum', default: 'local', optional: true, enums: ['dev', 'prod', 'local'] }))
console.log('NODE_ENV_OLD from Enum API with default: ', Env.enum('NODE_ENV_OLD', ['dev', 'prod', 'local'], 'local'))

export class EnvException extends Error {
  static CODE = 'ENV-500'

  constructor (message, metadata = {}) {
    super()
    this.message = message
    this.metadata = metadata
    this.code = EnvException.CODE
    this.name = 'stonejs.env'
  }
}

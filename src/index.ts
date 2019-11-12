import {
  Strategy as Oauth2Strategy,
  _StrategyOptionsBase,
  VerifyFunction,
  VerifyFunctionWithRequest,
} from 'passport-oauth2'
import 'passport'

declare module 'passport' {
  interface AuthenticateOptions {
    instanceId?: string
  }
}

export interface AuthorizationParamOptions {
  instanceId?: string
}

export interface _CortexStrategyOptionsBase
  extends Omit<_StrategyOptionsBase, 'authorizationURL' | 'tokenURL'> {
  authorizationURL?: string
  tokenURL?: string
  instanceId?: string
}

export interface CortexStrategyOptions extends _CortexStrategyOptionsBase {
  passReqToCallback?: false
}

export interface CortexStrategyOptionsWithRequest
  extends _CortexStrategyOptionsBase {
  passReqToCallback: true
}

export class CortexStrategy extends Oauth2Strategy {
  _instanceId: string | undefined

  constructor(options: CortexStrategyOptions, verify: VerifyFunction)
  constructor(
    options: CortexStrategyOptionsWithRequest,
    verify: VerifyFunctionWithRequest,
  )
  constructor(options: any, verify: any) {
    options = options || {}
    const { instanceId, ...restOfOptions } = options
    super(
      {
        authorizationURL:
          'https://identity.paloaltonetworks.com/as/authorization.oauth2',
        tokenURL: 'https://api.paloaltonetworks.com/api/oauth2/RequestToken',
        ...restOfOptions,
      },
      verify,
    )
    this.name = 'cortex'
    this._instanceId = instanceId
  }

  authorizationParams(options: AuthorizationParamOptions) {
    if (!this._instanceId && !options.instanceId) {
      throw new Error(
        'You must supply an instanceId to either the authentication function or the strategy constructor',
      )
    }
    return { instance_id: options.instanceId || this._instanceId }
  }
}

/**
 * Apple's "requires an in-effect agreement" error reads like a key or request
 * fault; it is an account-level agreement that has to be accepted in the web UI.
 */
export const agreementHint = (body: any): string =>
  JSON.stringify(body?.errors ?? '').match(/in-effect agreement/i)
    ? ' (Hint: this is an account-level agreement, not a problem with the API key or the request. ' +
      'The Account Holder must review and accept the pending agreement in App Store Connect under ' +
      'Business > Agreements; calls work again once it is in effect.)'
    : '';

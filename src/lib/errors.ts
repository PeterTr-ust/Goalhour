/** An error whose message is already written for the user and can be shown as is. */
export class UserFacingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UserFacingError';
  }
}

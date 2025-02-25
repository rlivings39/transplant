export const logger = {
  // eslint-disable-next-line no-undef
  log: (message: string, ...args: unknown[]) => console.log(message, ...args),
    // eslint-disable-next-line no-undef
  error: (message: string, ...args: unknown[]) => // // console.error(message, ...args)
};
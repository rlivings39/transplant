// Generic TypeScript Types file. 


export interface CustomEvent<T = any> extends Event {
    readonly detail: T;
  }
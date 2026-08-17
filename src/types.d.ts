export {};
declare global {
  interface Response {
    json(): Promise<any>;
  }
  interface Request {
    json(): Promise<any>;
  }
  interface CloudflareEnv {
    DB: any;
  }
}

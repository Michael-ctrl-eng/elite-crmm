declare module "formidable" {
  import { IncomingMessage } from "http";

  export interface File {
    filepath: string;
    originalFilename?: string | null;
    mimetype?: string | null;
    size: number;
  }

  export interface Fields {
    [key: string]: any;
  }

  export interface Files {
    [key: string]: File | File[];
  }

  export interface Options {
    multiples?: boolean;
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
  }

  export class IncomingForm {
    constructor(options?: Options);
    parse(
      req: IncomingMessage,
      callback: (err: any, fields: Fields, files: Files) => void
    ): void;
  }

  const formidable: (options?: Options) => IncomingForm;

  export default formidable;
}

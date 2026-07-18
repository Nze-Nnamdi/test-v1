declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: any);
    voiceNote: {
      create(args: any): Promise<any>;
      findMany(args?: any): Promise<any>;
    };
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }
}

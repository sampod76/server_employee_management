import { v4 as uuidV4 } from 'uuid';
export const uuidGenerator = () => {
  // Generate a random UUID
  return crypto.randomUUID();
};

export class UuidBuilder {
  public uuid: string;
  public uuidType: 'crypto' | 'uuid';
  constructor(uidType: 'crypto' | 'uuid' = 'crypto') {
    this.uuidType = uidType;
    if (this.uuidType === 'crypto') {
      // Use crypto.randomUUID() for generating cryptographically secure UUIDs
      this.uuid = crypto.randomUUID();
    } else {
      // Use uuidV4() for generating version 4 UUIDs
      this.uuid = uuidV4();
    }
  }
  public generateUuid(): string {
    if (this.uuidType === 'crypto') {
      return uuidGenerator();
    }
    // For 'v4' type, use uuidV4 from 'uuid' library
    return uuidV4();
  }
}

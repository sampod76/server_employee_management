import { Request } from 'express';
export const requestToBaseUrl = (req: Request) => {
  const fullUrl = req.protocol + '://' + req.get('host');
  return fullUrl;
};

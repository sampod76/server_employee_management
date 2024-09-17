import { ENUM_LANGUAGE, IMessage } from './language.interface';

export const language = (lag: string, message: IMessage): string => {
  const result: Record<IMessage, string> = {
    notFound: lag === ENUM_LANGUAGE.ENG ? 'Not found' : 'Not found',
  };

  return result[message];
};

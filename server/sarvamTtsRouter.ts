import { Router, type Request, type Response } from 'express';
import {
  createTranslationAudioHandler,
  type AudioCache,
  type SarvamTtsDependencies,
} from './translationAudioHandler';

export type { AudioCache, SarvamTtsDependencies } from './translationAudioHandler';
export { synthesizeSarvamAudio } from './sarvamTts';

export function createSarvamTtsRouter(dependencies: SarvamTtsDependencies): Router {
  const router = Router();
  const handleTranslationAudio = createTranslationAudioHandler(dependencies);

  router.post('/translation-audio', async (req: Request, res: Response) => {
    const result = await handleTranslationAudio(req.header('authorization'), req.body);
    if (result.headers) {
      for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
    }
    if (Buffer.isBuffer(result.body)) return res.status(result.statusCode).send(result.body);
    return res.status(result.statusCode).json(result.body);
  });

  return router;
}

import { Router } from 'express';
import { getExample } from '../controllers/exampleController.js';
const router = Router();
router.get('/', getExample);
export default router;

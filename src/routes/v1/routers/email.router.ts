import express, { Router } from 'express'

import {
    sendActivationEmail,
    sendWelcomeEmail,
    sendResetLink,
    resetPassword,
    sendVerificationEmail,
    sendInvite
} from '../../../controllers/email.controller';


const router: Router = express.Router({ mergeParams: true });
import { protect, authorize } from '../../../middleware/auth.mw'
import { validateChannels as vcd } from '../../../middleware/header.mw';

const roles = ['superadmin', 'admin', 'business', 'manager', 'talent', 'user'];

router.post('/welcome/:id', vcd, sendWelcomeEmail);
router.post('/activate/:id', vcd, protect, authorize(roles), sendActivationEmail);
router.post('/forgot-password/:id', vcd, sendResetLink);
router.post('/reset-password/:token', vcd, protect, authorize(roles), resetPassword);
router.post('/send-email-code', vcd, sendVerificationEmail);
router.post('/send-invite', vcd, sendInvite);

export default router;
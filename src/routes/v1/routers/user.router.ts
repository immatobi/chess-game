import express, { Router } from 'express'
import { CacheKeys, computeKey} from '../../../utils/cache.util'

import {
    getUsers,
    getUser,
    getUserKyc,
    addUser,
    acceptInvite,
    updateBasicKyc,
    updateFaceKyc,
    updateIDKyc,
    updateVerification,
    updateAddressKyc,
    changePassword,
    enableEmailVerification,
    enableSmsVerification,
    seedDB
} from '../../../controllers/user.controller';

import advanced from '../../../middleware/adanced.mw'
import User from '../../../models/User.model'

const router: Router = express.Router({ mergeParams: true });

import { protect, authorize } from '../../../middleware/auth.mw'
import { validateChannels as vcd } from '../../../middleware/header.mw';

const roles = ['superadmin', 'admin'];
const allRoles = ['superadmin', 'admin', 'user'];

router.get('/', vcd, protect, authorize(roles), advanced(User, [], CacheKeys.Users, 'firstName', false), getUsers);
router.get('/:id', vcd, protect, authorize(allRoles), getUser);
router.get('/kyc/:id', vcd, protect, authorize(allRoles), getUserKyc);
router.post('/add-user', vcd, protect, authorize(roles), addUser);
router.put('/change-password/:id', vcd, protect, authorize(allRoles), changePassword);
router.put('/accept-invite', vcd, acceptInvite);
router.put('/update-verification/:id', vcd, protect, authorize(roles), updateVerification);
router.put('/enable-sms/:id', vcd, protect, authorize(allRoles), enableSmsVerification);
router.put('/enable-email/:id', vcd, protect, authorize(allRoles), enableEmailVerification);
router.put('/kyc/update-basic/:id', vcd, protect, authorize(allRoles), updateBasicKyc);
router.put('/kyc/update-id/:id', vcd, protect, authorize(allRoles), updateIDKyc);
router.put('/kyc/update-face/:id', vcd, protect, authorize(allRoles), updateFaceKyc);
router.put('/kyc/update-address/:id', vcd, protect, authorize(allRoles), updateAddressKyc);

// don't implement these routes
router.post('/seed-db', vcd, protect, authorize(['superadmin']), seedDB);

export default router;
import express, { Router } from 'express'
import { CacheKeys, computeKey} from '../../../utils/cache.util'

import {
    getUsers,
    getUser,
    addUser,
    acceptInvite,
    changePassword,
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
router.post('/add-user', vcd, protect, authorize(roles), addUser);
router.put('/change-password/:id', vcd, protect, authorize(allRoles), changePassword);
router.put('/accept-invite', vcd, acceptInvite);

// don't implement these routes
router.post('/seed-db', vcd, protect, authorize(['superadmin']), seedDB);

export default router;
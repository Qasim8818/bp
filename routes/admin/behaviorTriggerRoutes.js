const express = require('express');
const router = express.Router();
const behaviorTriggerController = require('../../controllers/admin/behaviorTriggerController');
const adminAuth = require('../../middlewares/adminAuth');

// All routes require admin authentication
router.use(adminAuth);

// Behavior trigger routes
router.get('/behavior/:userId', behaviorTriggerController.getUserBehavior);
router.get('/triggers/:userId', behaviorTriggerController.getTriggerDecisions);
router.get('/system-stats', behaviorTriggerController.getSystemStats);
router.get('/patterns', behaviorTriggerController.getBehaviorPatterns);
router.delete('/cache/:userId', behaviorTriggerController.clearCache);

module.exports = router;

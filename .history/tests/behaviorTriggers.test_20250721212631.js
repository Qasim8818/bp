<test>
  const express = require('express');
  const request = require('supertest');
  const app = express();
  const behaviorTriggerController = require('../../controllers/admin/behaviorTriggerController');

  describe('Behavior Trigger Tests', () => {
    it('should return user behavior analysis', async () => {
      const res = await request(app)
        .get('/api/admin/behavior/test_user_123')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSpins');
      expect(res.body.data).toHaveProperty('winHistory');
    });

    it('should return trigger decisions for a user', async () => {
      const res = await request(app)
        .get('/api/admin/triggers/test_user_123')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('allowWin');
    });
  });
</test>

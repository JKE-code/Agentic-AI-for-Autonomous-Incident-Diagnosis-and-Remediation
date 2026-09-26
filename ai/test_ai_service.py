import unittest
from fastapi.testclient import TestClient
from ai.service import app

class TestAIService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    def test_scenarios_list(self):
        resp = self.client.get("/scenarios")
        self.assertEqual(resp.status_code, 200)
        scenarios = resp.json()
        self.assertEqual(len(scenarios), 6)
        ids = [s["incident_id"] for s in scenarios]
        self.assertIn("INC-001", ids)
        self.assertIn("INC-006", ids)

    def test_diagnose_inc_001(self):
        resp = self.client.post("/diagnose", json={"incident_id": "INC-001"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        
        self.assertEqual(data["incident_id"], "INC-001")
        self.assertIn(data["status"], ["AWAITING_APPROVAL", "DIAGNOSIS_COMPLETE"])
        self.assertTrue(len(data["timeline"]) > 0)
        self.assertTrue(len(data["hypotheses"]) > 0)
        self.assertIsNotNone(data["root_cause"])
        self.assertEqual(data["root_cause"]["root_cause_category"], "BAD_DEPLOYMENT")
        self.assertIsNotNone(data["remediation"])
        self.assertEqual(data["remediation"]["action"], "rollback_deployment")
        self.assertEqual(data["remediation"]["target_version"], "v1.4")
        self.assertTrue(len(data["audit_events"]) >= 5)

    def test_resume_workflow(self):
        resp = self.client.post("/resume", json={
            "thread_id": "thread-INC-001",
            "approval": "approved",
            "action_id": "ACT-001"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "PROCEEDING_TO_SANDBOX")

    def test_evaluation_endpoint(self):
        resp = self.client.post("/evaluate")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("agentic_system", data)
        self.assertEqual(data["agentic_system"]["metrics"]["total_scenarios"], 6)
        self.assertEqual(data["agentic_system"]["metrics"]["top_1_accuracy"], 1.0)

if __name__ == "__main__":
    unittest.main()

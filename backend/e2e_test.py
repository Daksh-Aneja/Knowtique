import httpx
import asyncio
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def run_e2e_tests():
    print("🚀 Starting Knowtique E2E Platform Test...")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=120.0) as client:
        # 1. Pipeline / ETL (L0-L2)
        print("\n[1/6] Testing Data Fabric (Pipeline Engine L0-L2)")
        pipeline_req = {
            "connector_slug": "rest_api",
            "connector_config": {
                "base_url": "https://jsonplaceholder.typicode.com",
                "endpoint": "/users",
                "batch_size": 10
            },
            "dag_config": {
                "nodes": [
                    {"id": "mapper_1", "type": "field_mapper", "config": {"auto_detect": True}},
                    {"id": "pii_1", "type": "pii_scrubber", "config": {"action": "redact", "confidence_threshold": 0.5}},
                    {"id": "chunk_1", "type": "chunker", "config": {"strategy": "recursive", "chunk_size": 100}}
                ],
                "edges": [
                    {"source": "mapper_1", "target": "pii_1"},
                    {"source": "pii_1", "target": "chunk_1"}
                ]
            },
            "destination_type": "local_file"
        }
        res = await client.post("/pipeline/run", json=pipeline_req)
        assert res.status_code == 200, f"Pipeline failed: {res.text}"
        data = res.json()
        print(f"  ✅ Pipeline run successful: {data['status']}")
        print(f"  📊 Stats: Read {data['records_read']}, Written {data['records_written']}, Chunks {data['chunks_produced']}")

        # 2. Rule Engine (L6)
        print("\n[2/6] Testing Knowledge Base (Rules Engine L6)")
        res = await client.get("/rules")
        assert res.status_code == 200
        rules = res.json()
        print(f"  ✅ Retrieved {len(rules)} active rules from KB.")

        # 3. Conflict Arena (L16)
        print("\n[3/6] Testing Conflict Arena (L16)")
        res = await client.get("/conflicts")
        assert res.status_code == 200
        conflicts = res.json()
        print(f"  ✅ Retrieved {conflicts['total']} conflicts. Open conflicts: {conflicts['open_count']}")

        if conflicts['conflicts']:
            c_id = conflicts['conflicts'][0]['id']
            res = await client.post(f"/conflicts/{c_id}/resolve", json={"resolution_type": "SUPERSEDE", "resolution_note": "E2E automated resolution"})
            assert res.status_code == 200
            print(f"  ✅ Resolved conflict {c_id}")

        # 4. Red Team Harness (L12)
        print("\n[4/6] Testing Red Team Harness (L12)")
        res = await client.get("/redteam/scans/recent")
        assert res.status_code == 200
        scans = res.json()
        print(f"  ✅ Retrieved {len(scans['scans'])} recent security scans.")

        # 5. Security Fabric (L17)
        print("\n[5/6] Testing Security Fabric (L17)")
        res = await client.get("/security/audit-log")
        assert res.status_code == 200
        logs = res.json()
        print(f"  ✅ Retrieved {logs['stats']['total_events']} audit log events.")
        print(f"  🛡️ Zero-trust stats: Allowed {logs['stats']['allowed']}, Blocked {logs['stats']['blocked']}")

        # 6. Elicitation (L5)
        print("\n[6/6] Testing Active Elicitation (L5)")
        res = await client.get("/elicitation/dashboard")
        assert res.status_code == 200
        dashboard = res.json()
        print(f"  ✅ Elicitation dashboard active. Pending questions: {len(dashboard['pending_questions'])}")

        print("\n🎉 All subsystems operational. Knowtique OS is ready for production.")

if __name__ == "__main__":
    asyncio.run(run_e2e_tests())

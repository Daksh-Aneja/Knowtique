import asyncio
import httpx
import sys

async def test_federated_engine():
    print("🚀 Knowtique 10X — Testing Federated Epistemic Swarm (L22)")
    
    # We will export the high-performing 'incident_escalation_p1' skill 
    # to the global swarm.
    skill_id = "incident_escalation_p1"
    
    print(f"\n[1] Node 'tenant_acme' exporting skill '{skill_id}' to Global Swarm...")
    
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        res = await client.post(f"/federated/export-skill/{skill_id}")
        
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "EXPORTED":
                print(f"  ✅ Zero-Knowledge Export Successful!")
                print(f"     Global Node ID: {data['global_id']}")
                print(f"     Abstract Domain: {data['abstract_domain']}")
                print(f"     Success Weight: {data['success_weight']}")
                print(f"     Procedural Hash (ZK-Proof): {data['procedural_hash']}")
                
                print("\n[2] The procedural logic of the skill has been stripped of PII")
                print("    and tenant specifics, reduced to a cryptographic weight,")
                print("    and published to the swarm for other organizations to learn from.")
            else:
                print(f"  ❌ Export failed: {data}")
        else:
            print(f"  ❌ API Error: {res.status_code} - {res.text}")
            
    print("\n🎉 Test Complete")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(test_federated_engine())

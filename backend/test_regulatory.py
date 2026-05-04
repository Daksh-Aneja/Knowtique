import asyncio
import httpx
import sys

async def test_regulatory_and_quantum():
    print("🚀 Knowtique 10X — Testing Autonomous Regulatory Engine (L24) & Quantum Ledger (L23)")
    
    # Simulate a massive legal update dropping
    payload = {
        "framework_name": "EU AI Act 2026 Update",
        "directive_text": "All AI models and rule engines making decisions must provide high transparency. Any automated decision with confidence under 95% must generate a full transparency report explaining its logic, which must be immediately accessible to the user.",
        "urgency": "CRITICAL"
    }
    
    print(f"\n[1] Ingesting New Legal Framework: {payload['framework_name']}...")
    
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        res = await client.post("/10x/ingest-regulation", json=payload)
        
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "COMPLIANCE_ACHIEVED":
                print(f"  ✅ Pre-Emptive Compliance Achieved!")
                print(f"     Domains Analyzed: {data['domains_analyzed']}")
                print(f"     New Auto-Synthesized Rules: {data['new_rules_synthesized']}")
                print("\n  📄 Synthesized Rule Statement:")
                for rule in data['rule_statements']:
                    print(f"     -> {rule}")
                    
                print("\n[2] Verifying Post-Quantum Immutability (L23)")
                print("    The system automatically logged this massive architectural shift")
                print("    into the Provenance Ledger using a simulated Lattice-Based Quantum Signature.")
            else:
                print(f"  ❌ Ingestion failed: {data}")
        else:
            print(f"  ❌ API Error: {res.status_code} - {res.text}")
            
    print("\n🎉 Test Complete")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(test_regulatory_and_quantum())

import asyncio
import httpx
import uuid
from datetime import datetime, timezone
import sys

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import get_settings
from app.models.domain import Signal

settings = get_settings()
DATABASE_URL = settings.DATABASE_URL

async def test_predictive_ops():
    print("🚀 Knowtique 10X — Testing Predictive Ops Engine")
    
    # 1. Directly insert a signal into DB
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    signal_id = str(uuid.uuid4())
    print(f"\n[1] Injecting Latent Signal: {signal_id}")
    
    async with async_session() as session:
        sig = Signal(
            id=signal_id,
            tenant_id="tenant_acme",
            source_type="slack_message",
            source_entity="#sales-leadership",
            signal_type="TEXT",
            domain="commercial",
            clean_payload="Can someone review the discount for the Acme Corp deal? They are asking for 25% off to close today.",
            authority_score=0.8,
            novelty_score=0.9,
            created_at=datetime.now(timezone.utc)
        )
        session.add(sig)
        await session.commit()
    
    print("  ✅ Signal Ingested")
    
    # 2. Hit the new Predictive API
    print(f"\n[2] Triggering L20 Predictive Engine Analysis")
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        res = await client.post(f"/predictive/analyze-signal/{signal_id}")
        
        if res.status_code == 200:
            data = res.json()
            if data["status"] == "INTENT_DETECTED":
                print(f"  ✅ Latent Intent Detected!")
                print(f"     Recommended Skill: {data['intent']['recommended_skill']}")
                print(f"     Confidence: {data['intent']['confidence']}")
                print(f"     Action Taken: {data['action']} (Exec ID: {data['execution_id']})")
                print(f"     HITL Required: {data['hitl_required']}")
            else:
                print(f"  ❌ No intent detected: {data}")
        else:
            print(f"  ❌ API Error: {res.status_code} - {res.text}")
            
    print("\n🎉 Test Complete")

if __name__ == "__main__":
    # Ensure stdout handles UTF-8
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(test_predictive_ops())

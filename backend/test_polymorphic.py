import asyncio
from app.core.database import AsyncSessionLocal
from app.models.domain import Skill
from app.services.polymorphic_engine import PolymorphicEngine

async def main():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import delete
        await db.execute(delete(Skill).where(Skill.skill_id == "polymorphic_demo_skill_2"))
        skill = Skill(
            skill_id="polymorphic_demo_skill_2",
            tenant_id="tenant-1",
            domain="IT",
            version="1.0",
            success_rate=0.98,
            mcp_tool_bindings=["slack_sender"],
            guardrails={}
        )
        db.add(skill)
        await db.commit()
        
        print("Synthesizing missing integration: zendesk_connector")
        res = await PolymorphicEngine.auto_patch_skill(db, "polymorphic_demo_skill_2", "zendesk_connector")
        print(res)
        
        print("Synthesizing missing integration: salesforce_bulk_api")
        res2 = await PolymorphicEngine.auto_patch_skill(db, "polymorphic_demo_skill_2", "salesforce_bulk_api")
        print(res2)
        
if __name__ == "__main__":
    asyncio.run(main())

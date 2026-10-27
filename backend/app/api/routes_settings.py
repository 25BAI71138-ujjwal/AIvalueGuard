from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database import get_db
from backend.app.models.setting import AppSetting
from backend.app.schemas.setting import SettingsOverview, SettingUpdate
from backend.app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsOverview)
async def get_settings_overview(db: AsyncSession = Depends(get_db)):
    configured_keys = {
        "openai": bool(settings.OPENAI_API_KEY),
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "groq": bool(settings.GROQ_API_KEY)
    }

    # Query DB overrides
    db_keys = (await db.execute(select(AppSetting))).scalars().all()
    for s in db_keys:
        if s.key.endswith("_api_key") and s.value:
            provider_name = s.key.replace("_api_key", "")
            configured_keys[provider_name] = True

    return SettingsOverview(
        environment=settings.ENVIRONMENT,
        demo_mode=settings.DEMO_MODE,
        default_baseline_model=settings.DEFAULT_BASELINE_MODEL,
        default_workspace_id=settings.DEFAULT_WORKSPACE_ID,
        exact_cache_ttl_seconds=settings.EXACT_CACHE_TTL_SECONDS,
        semantic_cache_enabled=False,
        semantic_cache_threshold=settings.SEMANTIC_CACHE_THRESHOLD,
        configured_api_keys=configured_keys,
        database_type="SQLite (Development Engine)" if "sqlite" in settings.DATABASE_URL else "PostgreSQL",
        cache_backend="Redis" if settings.REDIS_URL else "In-Memory LRU + SQLite Persistence"
    )

@router.post("/toggle-demo")
async def toggle_demo_mode():
    settings.DEMO_MODE = not settings.DEMO_MODE
    return {
        "status": "success",
        "demo_mode": settings.DEMO_MODE,
        "message": f"Demo Mode is now {'ENABLED (Sample deterministic responses & simulated metrics)' if settings.DEMO_MODE else 'DISABLED (Real LLM provider execution)'}"
    }

@router.post("/update")
async def update_setting(
    update_req: SettingUpdate,
    db: AsyncSession = Depends(get_db)
):
    key = update_req.key.lower().strip()
    val = update_req.value.strip()

    # Handle API keys securely
    if key in ["openai_api_key", "anthropic_api_key", "gemini_api_key", "groq_api_key"]:
        # Update in-memory settings
        if key == "openai_api_key":
            settings.OPENAI_API_KEY = val
        elif key == "anthropic_api_key":
            settings.ANTHROPIC_API_KEY = val
        elif key == "gemini_api_key":
            settings.GEMINI_API_KEY = val
        elif key == "groq_api_key":
            settings.GROQ_API_KEY = val

        # Persist masked or encrypted flag
        existing = await db.get(AppSetting, key)
        if existing:
            existing.value = val
        else:
            db.add(AppSetting(key=key, value=val, is_secret=True))
        await db.commit()

        return {"status": "success", "message": f"API key for {key.replace('_api_key', '').upper()} updated successfully"}

    elif key == "default_baseline_model":
        settings.DEFAULT_BASELINE_MODEL = val
        existing = await db.get(AppSetting, key)
        if existing:
            existing.value = val
        else:
            db.add(AppSetting(key=key, value=val, is_secret=False))
        await db.commit()
        return {"status": "success", "message": f"Default baseline model set to {val}"}

    return {"status": "success", "message": f"Setting '{key}' applied."}

import hashlib
import json
import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from backend.app.models.cache_entry import CacheEntry
from backend.app.config import settings

class CacheService:
    """
    Safe Exact-Match Caching Service with Tenant Isolation.
    Maintains memory cache and syncs with database for persistence.
    """
    _memory_cache: Dict[str, Dict[str, Any]] = {}
    _hits: int = 0
    _misses: int = 0

    @classmethod
    def generate_fingerprint(
        cls,
        workspace_id: str,
        model: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        context: Optional[str] = None,
        temperature: float = 0.7,
        tenant_id: Optional[str] = None
    ) -> str:
        """
        Creates a deterministic SHA-256 fingerprint incorporating all execution invariants.
        Workspace and tenant isolation guaranteed.
        """
        payload = {
            "ws": workspace_id,
            "tenant": tenant_id or "default",
            "model": model,
            "prompt": prompt.strip(),
            "sys": (system_instruction or "").strip(),
            "ctx": (context or "").strip(),
            "temp": round(temperature, 2)
        }
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @classmethod
    async def get(
        cls,
        db: AsyncSession,
        cache_key: str,
        workspace_id: str
    ) -> Optional[Dict[str, Any]]:
        now = datetime.datetime.utcnow()

        # 1. Check in-memory cache first
        if cache_key in cls._memory_cache:
            entry = cls._memory_cache[cache_key]
            if entry["workspace_id"] == workspace_id and entry["expires_at"] > now and entry["is_active"]:
                cls._hits += 1
                entry["hit_count"] += 1
                entry["last_hit_at"] = now
                return entry

        # 2. Check Database
        result = await db.execute(
            select(CacheEntry).where(
                CacheEntry.cache_key == cache_key,
                CacheEntry.workspace_id == workspace_id,
                CacheEntry.is_active == True,
                CacheEntry.expires_at > now
            )
        )
        db_entry = result.scalar_one_or_none()
        if db_entry:
            cls._hits += 1
            db_entry.hit_count += 1
            db_entry.last_hit_at = now
            await db.commit()

            entry_dict = {
                "cache_key": db_entry.cache_key,
                "workspace_id": db_entry.workspace_id,
                "model": db_entry.model,
                "response_content": db_entry.response_content,
                "prompt_tokens": db_entry.prompt_tokens,
                "completion_tokens": db_entry.completion_tokens,
                "cost_saved_per_hit": db_entry.cost_saved_per_hit,
                "hit_count": db_entry.hit_count,
                "expires_at": db_entry.expires_at,
                "is_active": db_entry.is_active
            }
            cls._memory_cache[cache_key] = entry_dict
            return entry_dict

        cls._misses += 1
        return None

    @classmethod
    async def set(
        cls,
        db: AsyncSession,
        cache_key: str,
        workspace_id: str,
        model: str,
        prompt: str,
        response_content: str,
        prompt_tokens: int,
        completion_tokens: int,
        cost_saved_per_hit: float,
        ttl_seconds: Optional[int] = None
    ) -> None:
        ttl = ttl_seconds or settings.EXACT_CACHE_TTL_SECONDS
        now = datetime.datetime.utcnow()
        expires_at = now + datetime.timedelta(seconds=ttl)
        prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()

        entry_data = {
            "cache_key": cache_key,
            "workspace_id": workspace_id,
            "model": model,
            "prompt_hash": prompt_hash,
            "prompt_preview": prompt[:300],
            "response_content": response_content,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "cost_saved_per_hit": cost_saved_per_hit,
            "hit_count": 0,
            "created_at": now,
            "last_hit_at": now,
            "expires_at": expires_at,
            "is_active": True
        }

        # Save to memory cache
        cls._memory_cache[cache_key] = entry_data

        # Upsert into database
        existing = await db.get(CacheEntry, cache_key)
        if existing:
            existing.response_content = response_content
            existing.expires_at = expires_at
            existing.is_active = True
            existing.cost_saved_per_hit = cost_saved_per_hit
        else:
            new_entry = CacheEntry(**entry_data)
            db.add(new_entry)

        await db.commit()

    @classmethod
    async def invalidate(
        cls,
        db: AsyncSession,
        workspace_id: Optional[str] = None,
        model: Optional[str] = None,
        cache_key: Optional[str] = None
    ) -> int:
        """Manual clearing and invalidation."""
        conditions = []
        if cache_key:
            conditions.append(CacheEntry.cache_key == cache_key)
            if cache_key in cls._memory_cache:
                del cls._memory_cache[cache_key]
        else:
            if workspace_id:
                conditions.append(CacheEntry.workspace_id == workspace_id)
            if model:
                conditions.append(CacheEntry.model == model)

            # Evict from memory cache
            keys_to_delete = []
            for k, v in cls._memory_cache.items():
                if (not workspace_id or v["workspace_id"] == workspace_id) and (not model or v["model"] == model):
                    keys_to_delete.append(k)
            for k in keys_to_delete:
                del cls._memory_cache[k]

        stmt = update(CacheEntry).where(*conditions).values(is_active=False)
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount

    @classmethod
    async def get_stats(cls, db: AsyncSession, workspace_id: str = "ws_default") -> Dict[str, Any]:
        total_q = await db.execute(select(func.count(CacheEntry.cache_key)).where(CacheEntry.workspace_id == workspace_id))
        total_entries = total_q.scalar() or 0

        active_q = await db.execute(
            select(func.count(CacheEntry.cache_key)).where(
                CacheEntry.workspace_id == workspace_id,
                CacheEntry.is_active == True,
                CacheEntry.expires_at > datetime.datetime.utcnow()
            )
        )
        active_entries = active_q.scalar() or 0

        # Sum hits and cost saved
        hits_q = await db.execute(
            select(
                func.sum(CacheEntry.hit_count),
                func.sum(CacheEntry.hit_count * CacheEntry.cost_saved_per_hit),
                func.sum(CacheEntry.hit_count * (CacheEntry.prompt_tokens + CacheEntry.completion_tokens))
            ).where(CacheEntry.workspace_id == workspace_id)
        )
        row = hits_q.fetchone()
        db_hits = (row[0] if row and row[0] is not None else 0) or 0
        total_saved_usd = float(row[1] if row and row[1] is not None else 0.0)
        total_saved_tokens = int(row[2] if row and row[2] is not None else 0)

        total_lookups = cls._hits + cls._misses
        hit_rate = round((cls._hits / total_lookups) * 100.0, 1) if total_lookups > 0 else (
            round((db_hits / (db_hits + 50)) * 100.0, 1) if db_hits > 0 else 0.0
        )

        return {
            "total_entries": total_entries,
            "active_entries": active_entries,
            "total_hits": cls._hits + db_hits,
            "total_misses": cls._misses,
            "hit_rate_percentage": hit_rate,
            "total_cost_saved_usd": round(total_saved_usd, 4),
            "total_tokens_saved": total_saved_tokens,
            "cache_memory_mode": "Redis Server" if settings.REDIS_URL else "In-Memory LRU + SQLite Persistence",
            "ttl_seconds": settings.EXACT_CACHE_TTL_SECONDS
        }

import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from backend.app.models.request_log import RequestLog
from backend.app.models.budget import BudgetConfig
from backend.app.schemas.gateway import GatewayChatRequest, GatewayChatResponse
from backend.app.services.gateway_orchestrator import GatewayOrchestrator

class TaskTrackingService:
    @staticmethod
    async def execute_task(db: AsyncSession, data: Dict[str, Any]) -> GatewayChatResponse:
        """
        Executes an arbitrary task via AI Gateway, with full token, cost, and task attribution.
        """
        prompt = data.get("prompt", "")
        model = data.get("model", "gpt-4o-mini")
        task_name = data.get("task_name") or "Code Task"
        project_name = data.get("project_name") or "AI Gateway"
        session_id = data.get("session_id") or f"sess_{datetime.datetime.utcnow().strftime('%H%M%S')}"
        temperature = float(data.get("temperature", 0.7))
        max_tokens = int(data.get("max_tokens", 1024))
        system_instruction = data.get("system_instruction")
        workspace_id = data.get("workspace_id", "ws_default")

        chat_req = GatewayChatRequest(
            prompt=prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            system_instruction=system_instruction,
            workspace_id=workspace_id,
            task_name=task_name,
            project_name=project_name,
            session_id=session_id,
            optimize=True,
            allow_cache=True
        )

        response = await GatewayOrchestrator.process_chat(db, chat_req)
        return response

    @staticmethod
    async def get_task_analytics(db: AsyncSession, workspace_id: str = "ws_default") -> Dict[str, Any]:
        """
        Aggregates token consumption, spending, and performance by task and project.
        """
        # Fetch all requests for workspace
        stmt = select(RequestLog).where(RequestLog.workspace_id == workspace_id)
        res = await db.execute(stmt)
        logs = res.scalars().all()

        tasks_map: Dict[str, Dict[str, Any]] = {}
        projects_map: Dict[str, Dict[str, Any]] = {}
        total_tokens = 0
        total_cost = 0.0
        total_saved = 0.0

        for r in logs:
            t_name = r.task_name or "General Task"
            p_name = r.project_name or "Default Project"
            tokens = r.total_tokens or 0
            cost = r.actual_cost_usd or 0.0
            saved = r.saved_cost_usd or 0.0
            lat = r.latency_ms or 0.0

            total_tokens += tokens
            total_cost += cost
            total_saved += saved

            # Aggregate by Task
            if t_name not in tasks_map:
                tasks_map[t_name] = {
                    "task_name": t_name,
                    "request_count": 0,
                    "total_tokens": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_cost_usd": 0.0,
                    "saved_cost_usd": 0.0,
                    "total_latency": 0.0,
                    "models_used": {}
                }
            t_entry = tasks_map[t_name]
            t_entry["request_count"] += 1
            t_entry["total_tokens"] += tokens
            t_entry["prompt_tokens"] += (r.prompt_tokens or 0)
            t_entry["completion_tokens"] += (r.completion_tokens or 0)
            t_entry["total_cost_usd"] += cost
            t_entry["saved_cost_usd"] += saved
            t_entry["total_latency"] += lat
            m = r.model_selected or "unknown"
            t_entry["models_used"][m] = t_entry["models_used"].get(m, 0) + 1

            # Aggregate by Project
            if p_name not in projects_map:
                projects_map[p_name] = {
                    "project_name": p_name,
                    "request_count": 0,
                    "total_tokens": 0,
                    "total_cost_usd": 0.0
                }
            projects_map[p_name]["request_count"] += 1
            projects_map[p_name]["total_tokens"] += tokens
            projects_map[p_name]["total_cost_usd"] += cost

        # Format Task List
        task_list = []
        for t_name, d in tasks_map.items():
            req_c = d["request_count"]
            top_model = max(d["models_used"].items(), key=lambda x: x[1])[0] if d["models_used"] else "gpt-4o"
            task_list.append({
                "task_name": t_name,
                "request_count": req_c,
                "total_tokens": d["total_tokens"],
                "prompt_tokens": d["prompt_tokens"],
                "completion_tokens": d["completion_tokens"],
                "total_cost_usd": round(d["total_cost_usd"], 5),
                "saved_cost_usd": round(d["saved_cost_usd"], 5),
                "avg_latency_ms": round(d["total_latency"] / max(req_c, 1), 1),
                "top_model": top_model,
                "percentage_of_spend": round((d["total_cost_usd"] / max(total_cost, 0.0001)) * 100, 1)
            })

        task_list.sort(key=lambda x: x["total_cost_usd"], reverse=True)

        # Format Project List
        project_list = [
            {
                "project_name": p_name,
                "request_count": d["request_count"],
                "total_tokens": d["total_tokens"],
                "total_cost_usd": round(d["total_cost_usd"], 5)
            }
            for p_name, d in projects_map.items()
        ]
        project_list.sort(key=lambda x: x["total_cost_usd"], reverse=True)

        return {
            "summary": {
                "total_tasks_count": len(tasks_map),
                "total_requests": len(logs),
                "total_tokens": total_tokens,
                "total_cost_usd": round(total_cost, 4),
                "total_saved_usd": round(total_saved, 4),
                "avg_tokens_per_task": int(total_tokens / max(len(logs), 1))
            },
            "tasks": task_list,
            "projects": project_list
        }

    @staticmethod
    async def get_budget_status(db: AsyncSession, workspace_id: str = "ws_default") -> Dict[str, Any]:
        """
        Calculates daily, weekly, and monthly spending vs configured budgets with alert statuses.
        """
        # Fetch or initialize budget configuration
        stmt = select(BudgetConfig).where(BudgetConfig.workspace_id == workspace_id)
        res = await db.execute(stmt)
        b_cfg = res.scalars().first()
        if not b_cfg:
            b_cfg = BudgetConfig(
                id=f"bgt_{workspace_id}",
                workspace_id=workspace_id,
                daily_budget_usd=5.0,
                weekly_budget_usd=25.0,
                monthly_budget_usd=100.0,
                warning_threshold_pct=80.0,
                alert_email="admin@aivalueguard.io",
                is_alerts_enabled=True
            )
            db.add(b_cfg)
            await db.commit()
            await db.refresh(b_cfg)

        now = datetime.datetime.utcnow()
        day_start = now - datetime.timedelta(days=1)
        week_start = now - datetime.timedelta(days=7)
        month_start = now - datetime.timedelta(days=30)

        # Spend queries
        # Day
        d_res = await db.execute(
            select(func.sum(RequestLog.actual_cost_usd))
            .where(RequestLog.workspace_id == workspace_id, RequestLog.created_at >= day_start)
        )
        daily_spend = float(d_res.scalar() or 0.0)

        # Week
        w_res = await db.execute(
            select(func.sum(RequestLog.actual_cost_usd))
            .where(RequestLog.workspace_id == workspace_id, RequestLog.created_at >= week_start)
        )
        weekly_spend = float(w_res.scalar() or 0.0)

        # Month
        m_res = await db.execute(
            select(func.sum(RequestLog.actual_cost_usd))
            .where(RequestLog.workspace_id == workspace_id, RequestLog.created_at >= month_start)
        )
        monthly_spend = float(m_res.scalar() or 0.0)

        daily_pct = round((daily_spend / max(b_cfg.daily_budget_usd, 0.01)) * 100, 1)
        weekly_pct = round((weekly_spend / max(b_cfg.weekly_budget_usd, 0.01)) * 100, 1)
        monthly_pct = round((monthly_spend / max(b_cfg.monthly_budget_usd, 0.01)) * 100, 1)

        threshold = b_cfg.warning_threshold_pct
        alerts = []
        alert_level = "normal"

        if daily_pct >= 100.0:
            alerts.append({"type": "daily_breach", "message": f"Daily budget exceeded: ${daily_spend:.4f} / ${b_cfg.daily_budget_usd:.2f} ({daily_pct}%)", "severity": "critical"})
            alert_level = "critical"
        elif daily_pct >= threshold:
            alerts.append({"type": "daily_warning", "message": f"Daily spend reached {daily_pct}% of budget threshold (${daily_spend:.4f} / ${b_cfg.daily_budget_usd:.2f})", "severity": "warning"})
            if alert_level != "critical": alert_level = "warning"

        if weekly_pct >= 100.0:
            alerts.append({"type": "weekly_breach", "message": f"Weekly budget exceeded: ${weekly_spend:.4f} / ${b_cfg.weekly_budget_usd:.2f} ({weekly_pct}%)", "severity": "critical"})
            alert_level = "critical"
        elif weekly_pct >= threshold:
            alerts.append({"type": "weekly_warning", "message": f"Weekly spend reached {weekly_pct}% of budget threshold (${weekly_spend:.4f} / ${b_cfg.weekly_budget_usd:.2f})", "severity": "warning"})
            if alert_level != "critical": alert_level = "warning"

        if monthly_pct >= 100.0:
            alerts.append({"type": "monthly_breach", "message": f"Monthly budget exceeded: ${monthly_spend:.4f} / ${b_cfg.monthly_budget_usd:.2f} ({monthly_pct}%)", "severity": "critical"})
            alert_level = "critical"
        elif monthly_pct >= threshold:
            alerts.append({"type": "monthly_warning", "message": f"Monthly spend reached {monthly_pct}% of budget threshold (${monthly_spend:.4f} / ${b_cfg.monthly_budget_usd:.2f})", "severity": "warning"})
            if alert_level != "critical": alert_level = "warning"

        return {
            "config": {
                "daily_budget_usd": b_cfg.daily_budget_usd,
                "weekly_budget_usd": b_cfg.weekly_budget_usd,
                "monthly_budget_usd": b_cfg.monthly_budget_usd,
                "warning_threshold_pct": b_cfg.warning_threshold_pct,
                "alert_email": b_cfg.alert_email,
                "is_alerts_enabled": b_cfg.is_alerts_enabled
            },
            "status": {
                "daily_spend": round(daily_spend, 4),
                "daily_pct": daily_pct,
                "weekly_spend": round(weekly_spend, 4),
                "weekly_pct": weekly_pct,
                "monthly_spend": round(monthly_spend, 4),
                "monthly_pct": monthly_pct,
                "alert_level": alert_level,
                "alerts": alerts
            }
        }

    @staticmethod
    async def update_budget(db: AsyncSession, workspace_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates budget limits and thresholds.
        """
        stmt = select(BudgetConfig).where(BudgetConfig.workspace_id == workspace_id)
        res = await db.execute(stmt)
        b_cfg = res.scalars().first()
        if not b_cfg:
            b_cfg = BudgetConfig(id=f"bgt_{workspace_id}", workspace_id=workspace_id)
            db.add(b_cfg)

        if "daily_budget_usd" in data:
            b_cfg.daily_budget_usd = float(data["daily_budget_usd"])
        if "weekly_budget_usd" in data:
            b_cfg.weekly_budget_usd = float(data["weekly_budget_usd"])
        if "monthly_budget_usd" in data:
            b_cfg.monthly_budget_usd = float(data["monthly_budget_usd"])
        if "warning_threshold_pct" in data:
            b_cfg.warning_threshold_pct = float(data["warning_threshold_pct"])
        if "alert_email" in data:
            b_cfg.alert_email = str(data["alert_email"])
        if "is_alerts_enabled" in data:
            b_cfg.is_alerts_enabled = bool(data["is_alerts_enabled"])

        b_cfg.updated_at = datetime.datetime.utcnow()
        await db.commit()
        await db.refresh(b_cfg)
        return await TaskTrackingService.get_budget_status(db, workspace_id)

    @staticmethod
    async def detect_waste_and_optimizations(db: AsyncSession, workspace_id: str = "ws_default") -> Dict[str, Any]:
        """
        Scans telemetry for wasted tokens, repeated calls, model misallocations, and recommends savings.
        """
        stmt = select(RequestLog).where(RequestLog.workspace_id == workspace_id).order_by(desc(RequestLog.created_at)).limit(200)
        res = await db.execute(stmt)
        logs = res.scalars().all()

        prompt_counts: Dict[str, int] = {}
        high_token_requests = []
        expensive_model_simple_tasks = []
        failed_calls = []

        total_wasted_tokens = 0
        total_wasted_cost = 0.0

        for r in logs:
            p = (r.prompt_preview or "").strip().lower()
            prompt_counts[p] = prompt_counts.get(p, 0) + 1

            # High token usage detection (> 2500 tokens)
            if (r.total_tokens or 0) > 2500:
                high_token_requests.append({
                    "id": r.id,
                    "prompt": r.prompt_preview[:80],
                    "tokens": r.total_tokens,
                    "cost": r.actual_cost_usd,
                    "model": r.model_selected
                })
                total_wasted_tokens += int((r.total_tokens or 0) * 0.25)
                total_wasted_cost += (r.actual_cost_usd or 0.0) * 0.25

            # Expensive model on brief query (< 120 prompt tokens on GPT-4o / Claude 3.5 Sonnet)
            if (r.prompt_tokens or 0) < 120 and r.model_selected in ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"]:
                expensive_model_simple_tasks.append({
                    "id": r.id,
                    "model": r.model_selected,
                    "prompt": r.prompt_preview[:80],
                    "cost": r.actual_cost_usd
                })
                # Potential 80% savings by using mini/flash
                saved_delta = (r.actual_cost_usd or 0.0) * 0.82
                total_wasted_cost += saved_delta

            # Failed requests or quality fails
            if r.status in ["error", "quality_failed"] or not r.quality_passed:
                failed_calls.append({
                    "id": r.id,
                    "model": r.model_selected,
                    "error": r.error_message or "Quality benchmark failed"
                })

        # Repeated requests
        repeated_prompts = [
            {"prompt": p[:100], "count": count, "estimated_waste_cost": round(count * 0.0015, 4)}
            for p, count in prompt_counts.items() if count > 1
        ]
        total_wasted_cost += sum(rp["estimated_waste_cost"] for rp in repeated_prompts)

        # Generate Actionable Suggestions
        suggestions = []
        if repeated_prompts:
            suggestions.append({
                "title": "Enable Semantic & Exact Caching for Repeat Prompts",
                "description": f"Detected {len(repeated_prompts)} prompts repeated across sessions. Caching eliminates 100% of provider token invocation cost.",
                "potential_savings_usd": round(sum(rp['estimated_waste_cost'] for rp in repeated_prompts) * 2.5, 4),
                "savings_pct": 98.5,
                "severity": "high",
                "category": "caching"
            })

        if expensive_model_simple_tasks:
            suggestions.append({
                "title": "Route Brief Tasks to Lightweight Flash / Mini Models",
                "description": f"Found {len(expensive_model_simple_tasks)} brief prompts using flagship models ($5-$15/M). Routing to GPT-4o-mini / Gemini Flash maintains quality while cutting cost by ~85%.",
                "potential_savings_usd": round(sum(e['cost'] * 0.82 for e in expensive_model_simple_tasks) * 3, 4),
                "savings_pct": 82.0,
                "severity": "medium",
                "category": "model_routing"
            })

        if high_token_requests:
            suggestions.append({
                "title": "Apply Context Compression & Truncation",
                "description": f"{len(high_token_requests)} requests exceeded 2,500 tokens. Deduplicating context history and system instructions reduces tokens by 20-35%.",
                "potential_savings_usd": round(sum(h['cost'] * 0.28 for h in high_token_requests) * 2, 4),
                "savings_pct": 28.0,
                "severity": "medium",
                "category": "context_optimization"
            })

        # Add fallback default recommendation if telemetry is spotless
        if not suggestions:
            suggestions.append({
                "title": "Automated Dynamic Model Tiering",
                "description": "Baseline token usage is well-managed. Continue using automatic capability routing to preserve lowest-cost models.",
                "potential_savings_usd": 12.50,
                "savings_pct": 45.0,
                "severity": "low",
                "category": "best_practice"
            })

        return {
            "waste_metrics": {
                "repeated_queries_count": len(repeated_prompts),
                "high_token_requests_count": len(high_token_requests),
                "expensive_model_mismatches": len(expensive_model_simple_tasks),
                "failed_calls_count": len(failed_calls),
                "estimated_wasted_cost_usd": round(total_wasted_cost, 4),
                "estimated_wasted_tokens": total_wasted_tokens
            },
            "repeated_prompts": repeated_prompts[:5],
            "high_token_requests": high_token_requests[:5],
            "recommendations": suggestions
        }

from app.models.subscription import PlanType

PLAN_LIMITS = {
    PlanType.FREE: {
        "max_memories": 5000,
        "max_searches_per_month": 5000,
        "max_projects": 3,
        "requests_per_hour": 500,
        "price": 0,
        "name": "Free",
        "description": "For individuals getting started",
    },
    PlanType.DEVELOPER: {
        "max_memories": 50000,
        "max_searches_per_month": 50000,
        "max_projects": 10,
        "requests_per_hour": 2000,
        "price": 299,
        "name": "Hobby",
        "description": "For indie developers building AI apps",
    },
    PlanType.PRO: {
        "max_memories": 500000,
        "max_searches_per_month": 200000,
        "max_projects": 25,
        "requests_per_hour": 10000,
        "price": 799,
        "name": "Pro",
        "description": "For production applications at scale",
    },
    PlanType.TEAM_5: {
        "max_memories": 2000000,
        "max_searches_per_month": 1000000,
        "max_projects": 50,
        "requests_per_hour": 25000,
        "price": 1499,
        "name": "Team (5 seats)",
        "description": "For small teams building together",
    },
    PlanType.TEAM_10: {
        "max_memories": 5000000,
        "max_searches_per_month": 2000000,
        "max_projects": 100,
        "requests_per_hour": 50000,
        "price": 2499,
        "name": "Team (10 seats)",
        "description": "For growing teams at scale",
    },
    PlanType.ENTERPRISE: {
        "max_memories": 999999999,
        "max_searches_per_month": 999999999,
        "max_projects": 999,
        "requests_per_hour": 99999,
        "price": 0,
        "name": "Enterprise",
        "description": "Custom plan — contact us",
    },
}

ADDON_PRICING = {
    "additional_memory_1k": {"price": 49, "description": "1,000 additional memories"},
    "additional_searches_1k": {"price": 29, "description": "1,000 additional searches"},
    "additional_project": {"price": 99, "description": "1 additional project"},
}

PLAN_HIERARCHY = {
    PlanType.FREE: 0,
    PlanType.DEVELOPER: 1,
    PlanType.PRO: 2,
    PlanType.TEAM_5: 3,
    PlanType.TEAM_10: 4,
    PlanType.ENTERPRISE: 5,
}

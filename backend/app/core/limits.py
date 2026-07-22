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
        "max_memories": 25000,
        "max_searches_per_month": 25000,
        "max_projects": 5,
        "requests_per_hour": 1000,
        "price": 399,
        "name": "Hobby",
        "description": "For indie developers building AI apps",
    },
    PlanType.PRO: {
        "max_memories": 250000,
        "max_searches_per_month": 100000,
        "max_projects": 10,
        "requests_per_hour": 5000,
        "price": 799,
        "name": "Pro",
        "description": "For production applications at scale",
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
    PlanType.ENTERPRISE: 3,
}

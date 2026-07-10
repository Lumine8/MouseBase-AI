"""
Secret rotation management script.

Usage:
    # Rotate JWT secret (invalidates all existing tokens)
    python scripts/rotate_secrets.py jwt

    # Rotate API key encryption key (re-encrypts all stored keys)
    python scripts/rotate_secrets.py encryption-key

    # Rotate Razorpay webhook secret
    python scripts/rotate_secrets.py webhook-secret <new_secret>

    # Check expiry of current JWT secret (placeholder — real check needs previous value)
    python scripts/rotate_secrets.py check

Requires .env file with current secrets in the backend directory.
"""

import argparse
import os
import secrets
import sys
from pathlib import Path


ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip().strip("\"'")
    return env


def save_env(env: dict[str, str]) -> None:
    lines: list[str] = []
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#") and "=" in stripped:
                key = stripped.partition("=")[0].strip()
                if key in env:
                    lines.append(f"{key}={env[key]}")
                    continue
            lines.append(line)
    for key, val in env.items():
        if not any(key in line for line in lines):
            lines.append(f"{key}={val}")
    ENV_PATH.write_text("\n".join(lines) + "\n")
    print(f"Updated {ENV_PATH}")


def rotate_jwt() -> None:
    env = load_env()
    old = env.get("JWT_SECRET", "")
    new = secrets.token_urlsafe(64)
    env["JWT_SECRET"] = new
    save_env(env)
    print(f"JWT_SECRET rotated: {old[:12]}... -> {new[:12]}...")
    print("WARNING: All existing JWT tokens are now invalid. Users must re-login.")


def rotate_encryption_key() -> None:
    env = load_env()
    old = env.get("API_KEY_ENCRYPTION_KEY", "")
    new = secrets.token_urlsafe(32)
    env["API_KEY_ENCRYPTION_KEY"] = new
    save_env(env)
    print(f"API_KEY_ENCRYPTION_KEY rotated: {old[:12]}... -> {new[:12]}...")
    print("WARNING: All encrypted API keys in the database are now undecryptable.")
    print("Run the re-encryption job to re-encrypt keys with the new key.")


def rotate_webhook_secret(new_secret: str | None = None) -> None:
    env = load_env()
    old = env.get("RAZORPAY_WEBHOOK_SECRET", "")
    secret = new_secret or secrets.token_urlsafe(32)
    env["RAZORPAY_WEBHOOK_SECRET"] = secret
    save_env(env)
    print(f"RAZORPAY_WEBHOOK_SECRET rotated: {old[:12]}... -> {secret[:12]}...")
    print("Update the webhook secret in Razorpay dashboard to match.")


def check_expiry() -> None:
    env = load_env()
    jwt_secret = env.get("JWT_SECRET", "")
    encryption_key = env.get("API_KEY_ENCRYPTION_KEY", "")

    print("Secret Rotation Status:")
    print(f"  JWT_SECRET:              {'set' if jwt_secret else 'MISSING'} ({len(jwt_secret)} chars)")
    print(f"  API_KEY_ENCRYPTION_KEY:  {'set' if encryption_key else 'MISSING'} ({len(encryption_key)} chars)")

    last_rotation = env.get("LAST_SECRET_ROTATION", "unknown")
    print(f"  Last rotation:            {last_rotation}")
    print()
    print("Recommended rotation schedule:")
    print("  - JWT_SECRET:             every 90 days")
    print("  - API_KEY_ENCRYPTION_KEY: every 180 days")
    print("  - RAZORPAY_WEBHOOK_SECRET: every 90 days")


def main() -> None:
    parser = argparse.ArgumentParser(description="MouseBase secret rotation manager")
    parser.add_argument(
        "action",
        choices=["jwt", "encryption-key", "webhook-secret", "check"],
        help="Which secret to rotate or check",
    )
    parser.add_argument("value", nargs="?", help="New value for webhook-secret (optional)")
    args = parser.parse_args()

    if args.action == "jwt":
        rotate_jwt()
    elif args.action == "encryption-key":
        rotate_encryption_key()
    elif args.action == "webhook-secret":
        rotate_webhook_secret(args.value)
    elif args.action == "check":
        check_expiry()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
build_from_csv.py — Generate data.js from Applications.csv and Roles.csv exports.

Usage:
  python build_from_csv.py
  python build_from_csv.py --apps ~/Downloads/Applications.csv --roles ~/Downloads/Roles.csv
  python build_from_csv.py --output /path/to/data.js
"""

import csv
import json
import os
import sys
import argparse
from datetime import date

DOWNLOADS = os.path.expanduser("~/Downloads")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def parse_bool(value):
    """Map Yes/No/empty to True/False/None."""
    v = value.strip().lower()
    if v in {"yes", "y", "true", "1"}:
        return True
    if v in {"no", "n", "false", "0"}:
        return False
    return None


def read_csv(path):
    for enc in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            with open(path, newline="", encoding=enc) as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path} with any known encoding")


def main():
    parser = argparse.ArgumentParser(description="Build data.js from CSV exports.")
    parser.add_argument("--apps",   default=os.path.join(DOWNLOADS, "Applications.csv"))
    parser.add_argument("--roles",  default=os.path.join(DOWNLOADS, "Roles.csv"))
    parser.add_argument("--output", default=os.path.join(SCRIPT_DIR, "data.js"))
    args = parser.parse_args()

    for path, label in [(args.apps, "Applications"), (args.roles, "Roles")]:
        if not os.path.exists(path):
            print(f"Error: {label} CSV not found at {path}")
            sys.exit(1)

    # ── Load applications (master list) ──────────────────────────────────────
    apps_rows = read_csv(args.apps)
    # Keyed by name; preserves operational_status for future use
    master = {}
    for row in apps_rows:
        name = row["name"].strip()
        if name:
            master[name] = {"name": name, "draft": False, "roles": []}

    # ── Load roles ────────────────────────────────────────────────────────────
    roles_rows = read_csv(args.roles)

    # Group roles by app name; track app names not in master
    roles_by_app = {}
    for row in roles_rows:
        app_name  = row["u_application_name"].strip()
        role_name = row["u_role_name"].strip()
        if not app_name or not role_name:
            continue
        roles_by_app.setdefault(app_name, []).append({
            "role":        role_name,
            "description": row["u_description"].strip() or None,
            "admin":       parse_bool(row["u_privileged"]),
            "covered":     parse_bool(row["u_covered_role"]),
        })

    # ── Merge ─────────────────────────────────────────────────────────────────
    # 1. Attach roles to master apps (exact match)
    for app_name, roles in roles_by_app.items():
        if app_name in master:
            master[app_name]["roles"] = roles
        else:
            # App in Roles.csv but not in Applications.csv — include it anyway
            master[app_name] = {"name": app_name, "draft": False, "roles": roles}

    # Sort alphabetically
    applications = sorted(master.values(), key=lambda a: a["name"].lower())

    # ── Build payload ─────────────────────────────────────────────────────────
    payload = {
        "generated":    date.today().isoformat(),
        "total":        len(applications),
        "applications": applications,
        "announcements": [],
        "changelog":    [],
    }

    js_content = (
        "// IAM Application Role Data — generated from CSV exports\n"
        "// DO NOT edit manually. Run build_from_csv.py to refresh.\n"
        f"// Generated: {payload['generated']} | Apps: {payload['total']}\n"
        "const APP_DATA = "
        + json.dumps(payload, indent=2, ensure_ascii=False)
        + ";\n"
    )

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(js_content)

    total_roles = sum(len(a["roles"]) for a in applications)
    print(f"Wrote {args.output}")
    print(f"  Apps:  {len(applications)}")
    print(f"  Roles: {total_roles}")

    # Warn about apps with no roles
    no_roles = [a["name"] for a in applications if not a["roles"]]
    if no_roles:
        print(f"\n  {len(no_roles)} apps have no roles in Roles.csv:")
        for n in no_roles:
            print(f"    - {n}")


if __name__ == "__main__":
    main()

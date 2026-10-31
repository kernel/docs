#!/usr/bin/env python3
"""Assert info/network-access.mdx matches the published network surface.

Customers copy the destination table and the CSP snippets on that page straight
into firewalls and Content Security Policies. The page and the surface have
already drifted from each other once, so this keeps them the same object:
compat/network_surface.json is vendored byte-identical from
kernel/kernel contracts/network-surface.json, which the API and the Ansible
inventory validator also read.

The vendored file is paired with compat/network_surface.sha256, the digest of
the canonical manifest it was vendored from. That is the pin: it records which
version of the surface this repo is on, and catches a copy edited in place.
"""

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "compat/network_surface.json"
PIN = ROOT / "compat/network_surface.sha256"
PAGE = ROOT / "info/network-access.mdx"

TABLE_ROW = re.compile(r"^\|(?!\s*(?:Feature|-))(.+)\|\s*$", re.M)
CODE_FENCE = re.compile(r"```text\n(.*?)```", re.S)
ORIGIN = re.compile(r"(?:https|wss)://(\S+?):(\d+)")


def backticked(cell):
    return [v.strip() for v in re.findall(r"`([^`]+)`", cell)]


def table_rows(page):
    """(feature, hosts, port, protocol) for each row of the destinations table."""
    section = page.split("## Required destinations", 1)[-1].split("\n## ", 1)[0]
    rows = []
    for raw in TABLE_ROW.findall(section):
        cells = [c.strip() for c in raw.split("|")]
        if len(cells) != 4:
            continue
        feature, hosts, port, protocol = cells
        rows.append((feature, backticked(hosts), backticked(port), protocol))
    return rows


def check_table(surface, page):
    errors = []
    documented = table_rows(page)
    published = surface["destinations"]
    if len(documented) != len(published):
        return [f"table has {len(documented)} rows, surface has {len(published)} destinations"]
    for row, dest in zip(documented, published):
        feature, hosts, ports, protocol = row
        if feature != dest["feature"]:
            errors.append(f"feature {feature!r} != {dest['feature']!r}")
        if hosts != dest["hosts"]:
            errors.append(f"{dest['feature']}: hosts {hosts} != {dest['hosts']}")
        if ports != [str(dest["port"])]:
            errors.append(f"{dest['feature']}: port {ports} != [{dest['port']!r}]")
        if protocol != dest["protocol"]:
            errors.append(f"{dest['feature']}: protocol {protocol!r} != {dest['protocol']!r}")
    return errors


def check_csp(surface, page):
    """Every session-facing host:port must appear in the Live View CSP, and nothing else."""
    session_facing = {
        f"{host}:{dest['port']}"
        for dest in surface["destinations"]
        if dest.get("session_facing")
        for host in dest["hosts"]
    }
    blocks = CODE_FENCE.findall(page)
    if not blocks:
        return ["no ```text CSP block found"]
    live_view = {f"{h}:{p}" for h, p in ORIGIN.findall(blocks[0])}
    errors = []
    for missing in sorted(session_facing - live_view):
        errors.append(f"Live View CSP is missing {missing}")
    for extra in sorted(o for o in live_view - session_facing if o.startswith("*.")):
        errors.append(f"Live View CSP allows {extra}, which is not session-facing in the surface")
    return errors


def check_exclusions(surface, page):
    """The stated scope of the commitment has to travel with the commitment."""
    return [f"page is missing the stated exclusion: {line}"
            for line in surface["not_covered"] if line not in page]


def check_pin():
    """The vendored copy has to be the one the pinned digest names.

    The sidecar is written by the sync workflow in kernel/kernel, never by hand,
    so a mismatch means either the copy or the pin was edited in place.
    """
    pinned = PIN.read_text().split()[0]
    vendored = hashlib.sha256(SURFACE.read_bytes()).hexdigest()
    if pinned != vendored:
        return [
            f"{SURFACE.relative_to(ROOT)} does not match {PIN.relative_to(ROOT)} "
            f"(pinned {pinned}, vendored {vendored})"
        ]
    return []


def main():
    surface = json.loads(SURFACE.read_text())
    page = PAGE.read_text()
    errors = (
        check_table(surface, page)
        + check_csp(surface, page)
        + check_exclusions(surface, page)
        + check_pin()
    )
    if errors:
        print(f"{PAGE.relative_to(ROOT)} does not match {SURFACE.relative_to(ROOT)}:\n", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print(
            "\nThe surface is a published commitment. Update it in kernel/kernel first, "
            "sync the copies, and land the changelog entry in the same change.",
            file=sys.stderr,
        )
        return 1
    print(f"network surface matches: {len(surface['destinations'])} destinations, CSP and exclusions consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())

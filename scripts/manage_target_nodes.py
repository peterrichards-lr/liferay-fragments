#!/usr/bin/env python3
"""Standalone Target Node Power & Cost Control Utility.

Manages power states (wake/sleep/enforce/status) for remote compute target nodes
(e.g., aws-1, aws-2) for cost control.

Last Updated: 2026-08-20 | Last Reviewed: 2026-08-20
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

CONFIG_FILE = Path(__file__).parent.parent / ".node-power-config.json"
STATE_FILE = Path(__file__).parent.parent / ".node-power-state.json"
LDMRC_FILE = Path.home() / ".ldmrc"


REMOTE_CONFIG_URL = os.environ.get(
    "NODE_POWER_CONFIG_URL",
    "https://raw.githubusercontent.com/peterrichards-lr/liferay-docker-manager/master/.node-power-config.json",
)


def ensure_config_file() -> None:
    """Ensures .node-power-config.json exists locally by downloading from central liferay-docker-manager repo if missing."""
    if not CONFIG_FILE.exists():
        try:
            import urllib.request

            print(
                "📥 Downloading central node power configuration from liferay-docker-manager repository..."
            )
            urllib.request.urlretrieve(REMOTE_CONFIG_URL, CONFIG_FILE)
            print("✅ Central node power configuration downloaded successfully.")
        except Exception as e:
            print(f"⚠️ Could not download central node config: {e}")


def load_target_nodes() -> dict:
    """Loads target node definitions from .node-power-config.json or ~/.ldmrc fallback."""
    ensure_config_file()
    nodes = {
        "aws-1": {
            "name": "aws-1",
            "schedule": "auto",
            "ec2_instance_id": "",
            "region": "",
            "host": "",
            "user": "ldm-automation",
        },
        "aws-2": {
            "name": "aws-2",
            "schedule": "auto",
            "ec2_instance_id": "",
            "region": "",
            "host": "",
            "user": "ldm-automation",
        },
    }

    # Override from ~/.ldmrc if present
    if LDMRC_FILE.exists():
        try:
            data = json.loads(LDMRC_FILE.read_text())
            for name, node_info in data.get("targets", {}).items():
                if name not in nodes:
                    nodes[name] = {
                        "name": name,
                        "schedule": "auto",
                        "ec2_instance_id": node_info.get("ec2_instance_id", ""),
                        "region": node_info.get("region", ""),
                        "host": node_info.get("host", ""),
                        "user": node_info.get("user", "ubuntu"),
                    }
                else:
                    nodes[name]["host"] = node_info.get("host", nodes[name]["host"])
                    nodes[name]["user"] = node_info.get("user", nodes[name]["user"])
                    if node_info.get("ec2_instance_id"):
                        nodes[name]["ec2_instance_id"] = node_info["ec2_instance_id"]
        except Exception:
            pass

    # Override from local config file if present
    if CONFIG_FILE.exists():
        try:
            custom_data = json.loads(CONFIG_FILE.read_text())
            for name, cfg in custom_data.get("nodes", {}).items():
                if name in nodes:
                    nodes[name].update(cfg)
                else:
                    nodes[name] = cfg
        except Exception:
            pass

    return nodes


def load_state() -> dict:
    """Loads transient wake state from .node-power-state.json."""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}


def save_state(state: dict) -> None:
    """Saves transient wake state to .node-power-state.json."""
    STATE_FILE.write_text(json.dumps(state, indent=2) + "\n")


def parse_duration(ttl_str: str) -> timedelta:
    """Parses duration string like '2h', '30m', '1d', '4h' into timedelta."""
    match = re.match(r"^(\d+)([smhd])$", ttl_str.strip().lower())
    if not match:
        return timedelta(hours=2)
    val, unit = int(match.group(1)), match.group(2)
    if unit == "s":
        return timedelta(seconds=val)
    if unit == "m":
        return timedelta(minutes=val)
    if unit == "h":
        return timedelta(hours=val)
    if unit == "d":
        return timedelta(days=val)
    return timedelta(hours=2)


def is_in_shutdown_window(dt: datetime, schedule: str) -> bool:
    """Determines whether the given datetime falls inside the scheduled shutdown window."""
    if schedule == "off":
        return False

    weekday = dt.weekday()  # Mon=0, Tue=1, ..., Fri=4, Sat=5, Sun=6
    hour = dt.hour

    is_overnight = hour >= 19 or hour < 7
    is_weekend = (
        (weekday == 4 and hour >= 19)
        or (weekday in (5, 6))
        or (weekday == 0 and hour < 7)
    )

    if schedule == "overnight":
        return is_overnight
    if schedule == "weekend":
        return is_weekend
    if schedule in ("auto", "default"):
        return is_overnight or is_weekend

    return False


def resolve_ec2_id(node_name: str, config: dict) -> str:
    """Resolves EC2 Instance ID via config or AWS EC2 tag discovery."""
    ec2_id = config.get("ec2_instance_id", "")
    if ec2_id and not ec2_id.startswith("i-0123456789") and not ec2_id.startswith("i-0987654321"):
        return ec2_id

    region = config.get("region", "eu-north-1")
    cmd = [
        "aws", "ec2", "describe-instances",
        "--filters", f"Name=tag:Name,Values={node_name}",
        "--query", "Reservations[0].Instances[0].InstanceId",
        "--output", "text"
    ]
    if region:
        cmd.extend(["--region", region])
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if res.returncode == 0 and res.stdout.strip() and res.stdout.strip() != "None":
        real_id = res.stdout.strip()
        print(f"  -> Auto-discovered EC2 Instance ID for '{node_name}': {real_id}")
        return real_id
    return ""


def update_node_host(node_name: str, new_ip: str) -> None:
    """Updates host in .node-power-config.json and LDM configuration."""
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text())
            if node_name in data.get("nodes", {}):
                data["nodes"][node_name]["host"] = new_ip
                CONFIG_FILE.write_text(json.dumps(data, indent=2) + "\n")
        except Exception:
            pass

    user = "ec2-user"
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text())
            user = data.get("nodes", {}).get(node_name, {}).get("user", "ec2-user")
        except Exception:
            pass

    subprocess.run(
        ["ldm", "target", "add", node_name, "--host", new_ip, "--user", user, "--overwrite"],
        capture_output=True,
        text=True,
        check=False,
    )


def wait_for_ssh(host: str, port: int = 22, timeout_sec: int = 90) -> bool:
    """Polls TCP port 22 until SSH daemon is ready to accept connections."""
    import socket, time

    print(f"⏳ Polling SSH availability on '{host}:{port}' (up to {timeout_sec}s)...")
    start = time.time()
    while time.time() - start < timeout_sec:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"✅ SSH daemon is online and accepting connections on '{host}:{port}'.")
                return True
        except (OSError, socket.timeout):
            time.sleep(3)
    print(f"⚠️ SSH poll timed out after {timeout_sec}s for '{host}:{port}'.")
    return False


def power_on_node(node_name: str, config: dict) -> bool:
    """Boots or resumes the specified target node using AWS CLI or SSH."""
    ec2_id = resolve_ec2_id(node_name, config)
    region = config.get("region", "eu-north-1")
    if ec2_id:
        cmd = ["aws", "ec2", "start-instances", "--instance-ids", ec2_id]
        if region:
            cmd.extend(["--region", region])
        print(f"▶ Booting AWS EC2 instance '{ec2_id}' for target node '{node_name}'...")
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode != 0:
            print(f"❌ AWS CLI error booting '{node_name}': {res.stderr.strip()}")
            return False

        print(f"⏳ Waiting for AWS EC2 instance '{ec2_id}' to reach 'running' state...")
        wait_cmd = ["aws", "ec2", "wait", "instance-running", "--instance-ids", ec2_id]
        if region:
            wait_cmd.extend(["--region", region])
        subprocess.run(wait_cmd, capture_output=True, text=True, check=False)

        desc_cmd = [
            "aws",
            "ec2",
            "describe-instances",
            "--instance-ids",
            ec2_id,
            "--query",
            "Reservations[0].Instances[0].PublicIpAddress",
            "--output",
            "text",
        ]
        if region:
            desc_cmd.extend(["--region", region])
        desc_res = subprocess.run(desc_cmd, capture_output=True, text=True, check=False)
        if (
            desc_res.returncode == 0
            and desc_res.stdout.strip()
            and desc_res.stdout.strip() != "None"
        ):
            new_ip = desc_res.stdout.strip()
            print(
                f"✅ Target node '{node_name}' powered on (Dynamic Public IP: {new_ip})."
            )
            update_node_host(node_name, new_ip)
            wait_for_ssh(new_ip)
        else:
            print(f"✅ Target node '{node_name}' powered on.")
        return True

    print(f"ℹ Node '{node_name}' has no active EC2 instance ID.")
    return True


def power_off_node(node_name: str, config: dict) -> bool:
    """Shuts down or stops the specified target node using AWS CLI or SSH."""
    ec2_id = resolve_ec2_id(node_name, config)
    if ec2_id:
        cmd = ["aws", "ec2", "stop-instances", "--instance-ids", ec2_id]
        if config.get("region"):
            cmd.extend(["--region", config["region"]])
        print(
            f"▶ Stopping AWS EC2 instance '{ec2_id}' for target node '{node_name}'..."
        )
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode == 0:
            print(f"✅ Target node '{node_name}' successfully powered off.")
            return True
        print(f"⚠️ AWS CLI error stopping '{node_name}': {res.stderr.strip()}")
        return False

    host = config.get("host")
    user = config.get("user", "ubuntu")
    if host and host != "localhost":
        cmd = ["ssh", f"{user}@{host}", "sudo shutdown -h now"]
        print(f"▶ Sending SSH shutdown command to '{user}@{host}'...")
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode == 0:
            print(f"✅ Target node '{node_name}' SSH shutdown command sent.")
            return True

    print(
        f"⚠️ Unable to shut down node '{node_name}': No EC2 instance ID or SSH host configured."
    )
    return False


def cmd_wake(args: argparse.Namespace) -> None:
    """Handler for 'wake <node> [--ttl 2h]'."""
    nodes = load_target_nodes()
    node_name = args.node
    if node_name == "***" or "*" in node_name:
        node_name = "aws-1"
    if node_name not in nodes:
        print(
            f"❌ Target node '{node_name}' not found. Available nodes: {', '.join(nodes.keys())}"
        )
        sys.exit(1)

    config = nodes[node_name]
    duration = parse_duration(args.ttl)
    now = datetime.now(timezone.utc)
    wake_until_dt = now + duration
    wake_until_str = wake_until_dt.isoformat()

    ok = power_on_node(node_name, config)
    if not ok:
        print(f"❌ Failed to power on target node '{node_name}'. Exiting with error.")
        sys.exit(1)

    state = load_state()
    state[node_name] = {
        "status": "woken",
        "wake_until": wake_until_str,
        "woken_at": now.isoformat(),
    }
    save_state(state)

    print(
        f"⏰ Target node '{node_name}' woken until {wake_until_dt.strftime('%Y-%m-%d %H:%M:%S UTC')} (TTL: {args.ttl})."
    )


def cmd_sleep(args: argparse.Namespace) -> None:
    """Handler for 'sleep <node>'."""
    nodes = load_target_nodes()
    node_name = args.node
    if node_name == "***" or "*" in node_name:
        node_name = "aws-1"
    if node_name not in nodes:
        print(
            f"❌ Target node '{node_name}' not found. Available nodes: {', '.join(nodes.keys())}"
        )
        sys.exit(1)

    config = nodes[node_name]

    ok = power_off_node(node_name, config)
    if not ok:
        print(f"❌ Failed to power off target node '{node_name}'. Exiting with error.")
        sys.exit(1)

    state = load_state()
    state[node_name] = {
        "status": "shutdown",
        "wake_until": "",
        "shutdown_at": datetime.now(timezone.utc).isoformat(),
    }
    save_state(state)


def cmd_enforce(args: argparse.Namespace) -> None:
    """Handler for 'enforce' (evaluates schedules and active wake TTLs)."""
    nodes = load_target_nodes()
    state = load_state()
    now = datetime.now(timezone.utc)
    now_local = datetime.now()

    print(
        f"🔍 Evaluating node power enforcement at {now_local.strftime('%Y-%m-%d %H:%M:%S')}..."
    )

    for name, config in nodes.items():
        schedule = config.get("schedule", "auto")
        node_state = state.get(name, {})
        wake_until_str = node_state.get("wake_until", "")

        is_woken = False
        if wake_until_str:
            try:
                wake_until_dt = datetime.fromisoformat(wake_until_str)
                if wake_until_dt > now:
                    is_woken = True
            except Exception:
                pass

        if is_woken:
            print(f"  • Node '{name}': WOKEN (TTL active until {wake_until_str})")
            continue

        in_window = is_in_shutdown_window(now_local, schedule)
        if in_window:
            print(
                f"  • Node '{name}': Shutdown window active (schedule: {schedule}). Enforcing shutdown."
            )
            power_off_node(name, config)
            state[name] = {
                "status": "shutdown",
                "wake_until": "",
                "shutdown_at": now.isoformat(),
            }
        else:
            print(f"  • Node '{name}': Business hours active. Ensuring node is booted.")
            power_on_node(name, config)

    save_state(state)


def query_live_ec2_status(ec2_id: str, region: str = "eu-north-1") -> tuple[str, str]:
    """Queries live AWS EC2 instance state and public IP address via AWS CLI."""
    if not ec2_id or ec2_id.startswith("i-0123456789") or ec2_id.startswith("i-0987654321"):
        return ("UNKNOWN", "")
    cmd = [
        "aws",
        "ec2",
        "describe-instances",
        "--instance-ids",
        ec2_id,
        "--query",
        "Reservations[0].Instances[0].[State.Name, PublicIpAddress]",
        "--output",
        "text",
    ]
    if region:
        cmd.extend(["--region", region])
    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if res.returncode == 0 and res.stdout.strip():
        parts = res.stdout.strip().split()
        ec2_state = parts[0].upper() if len(parts) > 0 else "UNKNOWN"
        public_ip = parts[1] if len(parts) > 1 and parts[1] != "None" else ""
        return (f"EC2:{ec2_state}", public_ip)
    return ("UNKNOWN", "")


def cmd_status(args: argparse.Namespace) -> None:
    """Handler for 'status'."""
    nodes = load_target_nodes()
    state = load_state()
    now = datetime.now(timezone.utc)
    now_local = datetime.now()

    print(
        "\n=========================================================================="
    )
    print("                TARGET COMPUTE NODE POWER CONTROL STATUS                  ")
    print("==========================================================================")
    print(
        f"Local Time: {now_local.strftime('%Y-%m-%d %H:%M:%S')} | Schedule Window: {'ACTIVE' if is_in_shutdown_window(now_local, 'auto') else 'INACTIVE'}\n"
    )
    print(
        f"{'NODE':<10} {'SCHEDULE':<10} {'EC2 ID':<20} {'STATUS':<15} {'DETAILS':<25}"
    )
    print("-" * 78)

    for name, config in nodes.items():
        schedule = config.get("schedule", "auto")
        ec2_id = config.get("ec2_instance_id", "N/A")
        region = config.get("region", "eu-north-1")
        node_state = state.get(name, {})
        wake_until_str = node_state.get("wake_until", "")

        status_label = "ACTIVE"
        details = "Normal operation"

        live_state, live_ip = query_live_ec2_status(ec2_id, region)
        if live_state != "UNKNOWN":
            status_label = live_state
            details = f"IP: {live_ip}" if live_ip else "IP: Unassigned"

        if wake_until_str:
            try:
                wake_until_dt = datetime.fromisoformat(wake_until_str)
                if wake_until_dt > now:
                    rem = wake_until_dt - now
                    mins = int(rem.total_seconds() // 60)
                    status_label = f"{live_state} (TTL)" if live_state != "UNKNOWN" else "WOKEN (TTL)"
                    details = f"{mins} mins remaining | IP: {live_ip}" if live_ip else f"{mins} mins remaining"
                else:
                    status_label = "TTL EXPIRED"
                    details = "Awaiting enforcement"
            except Exception:
                pass
        elif is_in_shutdown_window(now_local, schedule) and live_state == "UNKNOWN":
            status_label = "SHUTDOWN"
            details = "Scheduled off-hours"

        print(
            f"{name:<10} {schedule:<10} {ec2_id:<20} {status_label:<15} {details:<25}"
        )

    print(
        "==========================================================================\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Standalone Target Node Power & Cost Control Utility"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser(
        "status", help="Display target node power status and active wake TTLs"
    )

    wake_p = subparsers.add_parser(
        "wake", help="Temporarily wake a target node during shutdown hours"
    )
    wake_p.add_argument("node", help="Name of the target node (e.g. aws-1, aws-2)")
    wake_p.add_argument(
        "--ttl", default="2h", help="Wake duration (e.g. 2h, 30m, 4h). Default: 2h"
    )

    sleep_p = subparsers.add_parser("sleep", help="Immediately shut down a target node")
    sleep_p.add_argument("node", help="Name of the target node (e.g. aws-1, aws-2)")

    subparsers.add_parser(
        "enforce", help="Enforce scheduled overnight/weekend shutdowns and expire TTLs"
    )

    args = parser.parse_args()

    if args.command == "status":
        cmd_status(args)
    elif args.command == "wake":
        cmd_wake(args)
    elif args.command == "sleep":
        cmd_sleep(args)
    elif args.command == "enforce":
        cmd_enforce(args)


if __name__ == "__main__":
    main()

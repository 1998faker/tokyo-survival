"""Rebuild the browser scripts from the ordered source fragments."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    manifest = ROOT / "source/bundles.json"
    for output_name, source_names in json.loads(manifest.read_text()).items():
        output = ROOT / output_name
        bundle = b"".join((ROOT / name).read_bytes() for name in source_names)
        output.parent.mkdir(parents=True, exist_ok=True)
        if not output.exists() or output.read_bytes() != bundle:
            output.write_bytes(bundle)
        print(f"{output_name} ({len(source_names)} source files)")


if __name__ == "__main__":
    main()

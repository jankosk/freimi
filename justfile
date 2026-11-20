# Firmware setup and builds for the freimi ESP32 e-paper frame.
#
# Requires Python 3.9–3.13 available as `python3` on PATH. ESP-IDF's tooling
# shells out to it and creates its own virtualenv, so it must not be run from
# inside a project virtualenv.

set shell := ["bash", "-euo", "pipefail", "-c"]

esp_export := env("HOME") / "export-esp.sh"

# Loads espup's environment so the Xtensa GCC, clang and ldproxy are on PATH.
prelude := "if [ -f " + esp_export + " ]; then . " + esp_export + "; fi"

# List available recipes.
default:
    @just --list

# Install the Espressif Rust toolchain, its linker proxy and espflash.
setup:
    #!/usr/bin/env bash
    set -euo pipefail

    command -v rustup >/dev/null || { echo "rustup not found: https://rustup.rs" >&2; exit 1; }
    command -v espup >/dev/null || cargo install espup
    command -v espflash >/dev/null || cargo install espflash
    command -v ldproxy >/dev/null || cargo install ldproxy

    # Writes ~/export-esp.sh, which the build recipes source.
    espup install

    echo "Done. Run 'just build' to compile or 'just run' to flash."

# Build the firmware. Extra args are passed to cargo, e.g. `just build --release`.
build *args:
    {{prelude}}; cargo build {{args}}

# Build, flash and monitor the device (release profile).
run *args:
    {{prelude}}; cargo run --release {{args}}

# Format the Rust sources.
fmt:
    cargo fmt --all

# Lint the firmware, matching CI.
clippy:
    {{prelude}}; cargo clippy --all-targets --all-features --workspace -- -D warnings

# Remove build artifacts.
clean:
    cargo clean

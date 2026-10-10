#!/bin/sh
set -eu

SRC="https://raw.githubusercontent.com/fmidev/opendata-resources/master/symbols/SmartSymbol/light"
DEST="$(dirname "$0")/../server/assets/smartsymbol"

mkdir -p "$DEST"

for code in $(curl -sf "https://api.github.com/repos/fmidev/opendata-resources/contents/symbols/SmartSymbol/light" \
  | grep -o '"name": *"[0-9]*\.svg"' | grep -o '[0-9]*'); do
  curl -sfL "$SRC/$code.svg" \
    | sed -E \
        -e 's/fill="#[Ff]{3}"/fill="__WHITE__"/g' \
        -e 's/fill="#[Ff]{6}"/fill="__WHITE__"/g' \
        -e 's/fill="#[0-9A-Fa-f]{3,6}"/fill="#000"/g' \
        -e 's/fill="__WHITE__"/fill="#FFF"/g' \
    > "$DEST/$code.svg"
done

echo "Wrote $(find "$DEST" -name '*.svg' | wc -l | tr -d ' ') symbols to $DEST"

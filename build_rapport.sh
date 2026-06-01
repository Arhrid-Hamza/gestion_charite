#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if command -v pdflatex >/dev/null 2>&1; then
  pdflatex -interaction=nonstopmode -halt-on-error -shell-escape rapport.tex
  pdflatex -interaction=nonstopmode -halt-on-error -shell-escape rapport.tex
elif command -v xelatex >/dev/null 2>&1; then
  xelatex -interaction=nonstopmode -halt-on-error -shell-escape rapport.tex
  xelatex -interaction=nonstopmode -halt-on-error -shell-escape rapport.tex
else
  echo "No LaTeX compiler found. Install TeX Live or MiKTeX, then run this script again." >&2
  exit 1
fi
#!/usr/bin/env bash
# ConfigurAI executive cohort certificate generator
# Reads cohort1-graduates.csv and renders one PDF per row via headless Chrome.
# Output goes to certificates/ which is gitignored.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/certificate-template.html"
CSV="$SCRIPT_DIR/cohort1-graduates.csv"
SIG_IMG="$SCRIPT_DIR/images/signature.png"
OUT_DIR="$SCRIPT_DIR/certificates"
TMP_DIR="$SCRIPT_DIR/.cert-tmp"

# Locate Chrome (Windows / Mac / Linux fallbacks)
CHROME=""
for candidate in \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "$(command -v google-chrome 2>/dev/null || true)" \
  "$(command -v chromium 2>/dev/null || true)"
do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    CHROME="$candidate"
    break
  fi
done

if [ -z "$CHROME" ]; then
  echo "ERROR: Could not locate Chrome or Edge. Please install Chrome." >&2
  exit 1
fi

mkdir -p "$OUT_DIR" "$TMP_DIR"

# Build the signature block once.
# If images/signature.png exists, embed it as a data URI <img>.
# Otherwise fall back to Great Vibes script text.
if [ -f "$SIG_IMG" ]; then
  SIG_B64="$(base64 -w0 "$SIG_IMG")"
  SIGNATURE_BLOCK='<img class="sig-img" src="data:image/png;base64,'"$SIG_B64"'" alt="Signature">'
  echo "Signature: using images/signature.png"
else
  SIGNATURE_BLOCK='<div class="sig-script">Orgesa Meli</div>'
  echo "Signature: image not found, using Great Vibes script fallback"
fi
export SIGNATURE_BLOCK

# Process CSV (skip header)
row=0
while IFS=, read -r name completion_date cert_id || [ -n "$name" ]; do
  row=$((row + 1))
  # Skip header
  if [ "$row" -eq 1 ]; then continue; fi
  # Skip blank lines
  if [ -z "${name// /}" ]; then continue; fi

  # Trim whitespace and strip quotes
  name="${name#"${name%%[![:space:]]*}"}"
  name="${name%"${name##*[![:space:]]}"}"
  name="${name%\"}"; name="${name#\"}"
  completion_date="${completion_date#"${completion_date%%[![:space:]]*}"}"
  completion_date="${completion_date%"${completion_date##*[![:space:]]}"}"
  completion_date="${completion_date%\"}"; completion_date="${completion_date#\"}"
  cert_id="${cert_id#"${cert_id%%[![:space:]]*}"}"
  cert_id="${cert_id%"${cert_id##*[![:space:]]}"}"
  cert_id="${cert_id%\"}"; cert_id="${cert_id#\"}"
  # Strip CR (Windows line endings)
  cert_id="${cert_id%$'\r'}"
  completion_date="${completion_date%$'\r'}"
  name="${name%$'\r'}"

  echo "Rendering: $name | $completion_date | $cert_id"

  # Safe filename: replace anything that is not alnum, dash or underscore
  safe_name="$(echo "$name" | tr -c '[:alnum:]' '_' )"
  out_html="$TMP_DIR/${cert_id}_${safe_name}.html"
  out_pdf="$OUT_DIR/${cert_id}_${safe_name}.pdf"

  # Substitute placeholders using perl with env vars (avoids quoting traps)
  CERT_NAME="$name" CERT_DATE="$completion_date" CERT_ID="$cert_id" \
    perl -pe 's/\Q{{STUDENT_NAME}}\E/$ENV{CERT_NAME}/g; s/\Q{{COMPLETION_DATE}}\E/$ENV{CERT_DATE}/g; s/\Q{{CERTIFICATE_ID}}\E/$ENV{CERT_ID}/g; s/\Q{{SIGNATURE_BLOCK}}\E/$ENV{SIGNATURE_BLOCK}/g' \
    "$TEMPLATE" > "$out_html"

  # Convert local path to file URI for Chrome
  if [[ "$out_html" == /c/* ]]; then
    file_uri="file:///$(echo "$out_html" | sed 's|^/c/|C:/|')"
  else
    file_uri="file://$out_html"
  fi

  # Render via headless Chrome
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --no-pdf-header-footer \
    --print-to-pdf-no-header \
    --print-to-pdf="$out_pdf" \
    "$file_uri" 2>/dev/null || true

  if [ -f "$out_pdf" ]; then
    echo "  -> $out_pdf"
  else
    echo "  ERROR: PDF not produced for $name" >&2
  fi
done < "$CSV"

# Clean temp html
rm -rf "$TMP_DIR"

echo ""
echo "Done. Output in: $OUT_DIR"

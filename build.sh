#!/usr/bin/env bash
#
# build.sh — clean-qrcode 扩展打包脚本
#
# 用法:
#   ./build.sh          # 生成 .zip（分发/商店上传）
#   ./build.sh --crx    # 额外生成 .crx（本地安装），首次会生成签名密钥 key.pem
#   ./build.sh --clean  # 清理 build/ 产物
#
# 产物输出到 build/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/build"
CRX=0
CLEAN=0
for arg in "$@"; do
  case "$arg" in
    --crx) CRX=1 ;;
    --clean) CLEAN=1 ;;
    *) echo "未知参数: $arg" >&2; exit 1 ;;
  esac
done

if [[ "$CLEAN" -eq 1 ]]; then
  rm -rf "$OUT_DIR"
  echo "已清理 build/"
  exit 0
fi

# 从 manifest.json 读取版本号
VERSION="$(node -e "console.log(require('./manifest.json').version)")"
EXT_NAME="clean-qrcode"
ZIP_NAME="${EXT_NAME}-v${VERSION}.zip"

# 需要打包进扩展的文件（按 manifest 依赖，排除 .git/文档/CI/打包产物）
PACK_FILES=(
  manifest.json
  background.js
  popup.html
  lib
  icon
  _locales
)

mkdir -p "$OUT_DIR"

echo "==> 打包 zip: $OUT_DIR/$ZIP_NAME (v$VERSION)"
# 用临时目录组装，保证 zip 内不含多余目录层级
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
STAGE="$TMP_DIR/$EXT_NAME"
mkdir -p "$STAGE"

for f in "${PACK_FILES[@]}"; do
  cp -R "$f" "$STAGE/"
done

# 清理 stage 里误带进的构建残留
find "$STAGE" -name '.DS_Store' -delete

(
  cd "$STAGE"
  zip -rq "$OUT_DIR/$ZIP_NAME" .
)
echo "   完成: $OUT_DIR/$ZIP_NAME"

# 可选：生成 .crx
if [[ "$CRX" -eq 1 ]]; then
  CRX_NAME="${EXT_NAME}-v${VERSION}.crx"
  echo "==> 打包 crx: $OUT_DIR/$CRX_NAME"
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [[ ! -f "$CHROME" ]]; then
    echo "   ! 未找到 Chrome，跳过 crx（仅输出 zip）" >&2
  else
    "$CHROME" --pack-extension="$STAGE" >/dev/null 2>&1 || true
    # Chrome 默认把 .crx 与 .pem 放在扩展目录的同级（即 TMP_DIR）
    if [[ -f "$TMP_DIR/$EXT_NAME.crx" ]]; then
      mv "$TMP_DIR/$EXT_NAME.crx" "$OUT_DIR/$CRX_NAME"
    fi
    # 首次打包会生成 key.pem；复制到项目根，便于后续复用同一签名
    if [[ -f "$TMP_DIR/$EXT_NAME.pem" ]]; then
      cp "$TMP_DIR/$EXT_NAME.pem" "$ROOT/key.pem"
      echo "   + 已保存签名密钥 key.pem（请勿提交到 git，妥善保管）"
    fi
    echo "   完成: $OUT_DIR/$CRX_NAME"
  fi
fi

echo ""
echo "==> 产物目录: $OUT_DIR"
ls -lh "$OUT_DIR" | tail -n +2

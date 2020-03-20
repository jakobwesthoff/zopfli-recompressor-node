#!/bin/sh
set -e
BASE_DIR="$(readlink -f "$(dirname "$0")/../..")"

PACKAGE_JSON="${BASE_DIR}/package.json"
VERSION="$(cat "${BASE_DIR}/package.json"|jq -r '.version')"
RELEASE_DIR="${BASE_DIR}/release"

npm run clean
npm run build

if [ -d "${RELEASE_DIR}" ]; then
  rm -rf "${RELEASE_DIR}"
fi

mkdir -p "${RELEASE_DIR}"

for i in linux windows macos; do
  PLATFORM_DIR="${RELEASE_DIR}/${i}/zopfli-recompress-${VERSION}"
  mkdir -p "${PLATFORM_DIR}"
  if [ "$i" == "windows" ]; then
    cp -v "${BASE_DIR}/bin/zopfli-recompress-${i}.exe" "${PLATFORM_DIR}/zopfli-recompress.exe"
  else
    cp -v "${BASE_DIR}/bin/zopfli-recompress-${i}" "${PLATFORM_DIR}/zopfli-recompress"
  fi
done

pushd "${RELEASE_DIR}/linux"
tar cvjf ../zopfli-recompress-${VERSION}-linux.tar.gz .
popd
rm -rf "${RELEASE_DIR}/linux"

pushd "${RELEASE_DIR}/windows"
zip -r -9 -v "../zopfli-recompress-${VERSION}-windows.zip" "zopfli-recompress-${VERSION}"
popd
rm -rf "${RELEASE_DIR}/windows"

pushd "${RELEASE_DIR}/macos"
zip -r -9 -v "../zopfli-recompress-${VERSION}-macos.zip" "zopfli-recompress-${VERSION}"
popd
rm -rf "${RELEASE_DIR}/macos"

echo "Release packages build!"
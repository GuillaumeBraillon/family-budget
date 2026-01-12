#!/bin/bash

# Script de release automatisé
# Usage: ./scripts/release.sh 2.6.7 "Description courte de la release"

set -e

VERSION=$1
DESCRIPTION=$2

if [ -z "$VERSION" ] || [ -z "$DESCRIPTION" ]; then
  echo "❌ Usage: ./scripts/release.sh <version> <description>"
  echo "   Exemple: ./scripts/release.sh 2.6.7 \"Correction de bugs\""
  exit 1
fi

echo "🚀 Release v$VERSION - $DESCRIPTION"
echo ""

# 1. Vérifier que tout est commité
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Erreur: Il y a des modifications non commitées"
  git status --short
  exit 1
fi

# 2. Mettre à jour package.json
echo "📝 Mise à jour de package.json..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

# 3. Vérifier que CHANGELOG.md a été mis à jour
if ! grep -q "\[$VERSION\]" CHANGELOG.md; then
  echo "⚠️  Attention: CHANGELOG.md ne contient pas encore la version $VERSION"
  read -p "Continuer quand même ? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    # Annuler les changements de package.json
    git checkout package.json
    exit 1
  fi
fi

# 4. Commit + Tag
echo "📦 Commit et création du tag..."
git add package.json
git commit -m "chore: bump version to $VERSION"
git tag -a "v$VERSION" -m "Version $VERSION - $DESCRIPTION"

echo ""
echo "✅ Release v$VERSION créée avec succès !"
echo ""
echo "📤 Pour pousser vers GitHub :"
echo "   git push origin main"
echo "   git push origin v$VERSION"

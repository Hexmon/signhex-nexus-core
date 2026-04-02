# Signhex Nexus Core

`signhex-nexus-core` is the CMS frontend for the Signhex platform.

## Scope

This repo owns CMS product code only:

- React/Vite application source
- UI components and pages
- frontend build/test config
- CMS-only developer docs

Deployment, support, QA, production, and multi-service runbooks are owned by the `signhex-platform` repo.

Canonical platform docs:

- product export packaging: `signhex-platform/docs/runbooks/product-export-packaging.md`
- QA: `signhex-platform/docs/runbooks/onprem-qa-setup.md`
- production: `signhex-platform/docs/runbooks/onprem-production-setup.md`
- bundle workflow: `signhex-platform/docs/runbooks/onprem-bundle-builder.md`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment Note

Do not deploy this repo checkout directly to QA or production targets. The supported deployment path is:

1. generate the CMS deploy package from `signhex-platform/scripts/export/package-cms.sh`
2. assemble QA or production runtime bundles from the `signhex-platform` repo

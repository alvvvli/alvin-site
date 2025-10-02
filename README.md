# Alvin Site — Quickstart

## Prereqs
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install mkdocs-material mkdocs-minify-plugin mkdocs-glightbox
```

## Run
```bash
cd alvin-site
mkdocs serve
```

## Build
```bash
mkdocs build
```

## Deploy (GitHub Pages)
```bash
pip install mkdocs-gh-deploy
mkdocs gh-deploy -b gh-pages
```
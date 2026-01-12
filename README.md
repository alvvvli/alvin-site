# dbd

## prq
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install mkdocs-material mkdocs-minify-plugin mkdocs-glightbox
```

## run
```bash
cd alvin-site
mkdocs serve
```

## build
```bash
mkdocs build
```

## deploy
```bash
pip install mkdocs-gh-deploy
mkdocs gh-deploy -b gh-pages
```

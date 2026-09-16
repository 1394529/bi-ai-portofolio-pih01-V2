# Portfolio V2 — Installation

## Structure
- `app.py` — Flask application
- `templates/index.html` — interface V2
- `static/css/style.css` — styles V2
- `static/js/main.js` — interactions and bilingual rendering
- `instance/content.json` — contenu FR/EN
- `files/CV_AndrianirinaPH_20260901_Stand-AF-AA-QA-BI-AI_v3.0.pdf` — CV officiel
- `requirements.txt` — dépendances

## Variables d'environnement
Définir au minimum :
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SECRET_KEY`

Exemple Render :
`pip install -r requirements.txt`

Start command :
`gunicorn app:app`

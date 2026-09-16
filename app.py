from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from functools import wraps
import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "instance" / "content.json"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "dev-only-secret-change-in-render"
)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


def get_default_data():
    """Minimal V2 fallback. The production source of truth is instance/content.json."""
    return {
        "hero": {"fr": {}, "en": {}},
        "about": {"fr": {}, "en": {}},
        "expertise": {"fr": {}, "en": {}, "items": []},
        "projects": {"fr": {}, "en": {}, "items": []},
        "experience": {"fr": {}, "en": {}, "items": []},
        "education": {"fr": {}, "en": {}, "items": []},
        "contact": {"fr": {}, "en": {}},
        "nav": {"fr": {}, "en": {}},
        "meta": {"fr": {}, "en": {}},
        "toolbox": {"fr": {}, "en": {}, "groups": []},
    }


def load_data():
    if DATA_FILE.exists():
        try:
            with DATA_FILE.open("r", encoding="utf-8") as file:
                return json.load(file)
        except (json.JSONDecodeError, OSError):
            app.logger.exception("Unable to read %s", DATA_FILE)
    return get_default_data()


def save_data(data):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temp_file = DATA_FILE.with_suffix(".tmp")
    with temp_file.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
    temp_file.replace(DATA_FILE)


def login_required(function):
    @wraps(function)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("admin_login"))
        return function(*args, **kwargs)
    return decorated


@app.route("/")
def index():
    return render_template("index.html", data=load_data())


@app.route("/api/content")
def api_content():
    return jsonify(load_data())


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None

    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")

        if ADMIN_PASSWORD and username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("admin_dashboard"))

        error = "Identifiants incorrects."

    return render_template("admin/login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))


@app.route("/admin")
@login_required
def admin_dashboard():
    return render_template("admin/dashboard.html", data=load_data())


# -----------------------------------------------------------------------------
# Legacy admin endpoints kept for compatibility with the existing admin UI.
# The public V2 site reads the V2 JSON structure directly.
# -----------------------------------------------------------------------------

@app.route("/admin/save/hero", methods=["POST"])
@login_required
def admin_save_hero():
    data = load_data()
    data.setdefault("hero", {})

    for lang in ("fr", "en"):
        data["hero"].setdefault(lang, {})
        for field in ("title", "subtitle", "tagline", "cta"):
            key = f"{lang}_{field}"
            if key in request.form:
                data["hero"][lang][field] = request.form[key]

    save_data(data)
    flash("Section Hero sauvegardée ✓", "success")
    return redirect(url_for("admin_dashboard") + "#hero")


@app.route("/admin/save/about", methods=["POST"])
@login_required
def admin_save_about():
    data = load_data()
    data.setdefault("about", {})

    for lang in ("fr", "en"):
        data["about"].setdefault(lang, {})
        for field in ("heading", "description", "value", "experience", "projects_done", "clients"):
            key = f"{lang}_{field}"
            if key in request.form:
                data["about"][lang][field] = request.form[key]

    save_data(data)
    flash("Section À propos sauvegardée ✓", "success")
    return redirect(url_for("admin_dashboard") + "#about")


@app.route("/admin/save/skills", methods=["POST"])
@login_required
def admin_save_skills():
    data = load_data()
    data.setdefault("skills", {})
    data["skills"].setdefault("fr", {})
    data["skills"].setdefault("en", {})
    data["skills"]["fr"]["heading"] = request.form.get("fr_heading", "")
    data["skills"]["en"]["heading"] = request.form.get("en_heading", "")

    categories = []
    index = 0
    while f"cat_icon_{index}" in request.form:
        categories.append({
            "icon": request.form.get(f"cat_icon_{index}", ""),
            "name_fr": request.form.get(f"cat_name_fr_{index}", ""),
            "name_en": request.form.get(f"cat_name_en_{index}", ""),
            "items": [
                item.strip()
                for item in request.form.get(f"cat_items_{index}", "").split(",")
                if item.strip()
            ],
        })
        index += 1

    data["skills"]["categories"] = categories
    save_data(data)
    flash("Section Compétences sauvegardée ✓", "success")
    return redirect(url_for("admin_dashboard") + "#skills")


@app.route("/admin/save/services", methods=["POST"])
@login_required
def admin_save_services():
    data = load_data()
    data.setdefault("services", {})
    data["services"].setdefault("fr", {})
    data["services"].setdefault("en", {})
    data["services"]["fr"]["heading"] = request.form.get("fr_heading", "")
    data["services"]["en"]["heading"] = request.form.get("en_heading", "")

    items = []
    index = 0
    while f"svc_icon_{index}" in request.form:
        items.append({
            "icon": request.form.get(f"svc_icon_{index}", ""),
            "title_fr": request.form.get(f"svc_title_fr_{index}", ""),
            "title_en": request.form.get(f"svc_title_en_{index}", ""),
            "desc_fr": request.form.get(f"svc_desc_fr_{index}", ""),
            "desc_en": request.form.get(f"svc_desc_en_{index}", ""),
        })
        index += 1

    data["services"]["items"] = items
    save_data(data)
    flash("Section Services sauvegardée ✓", "success")
    return redirect(url_for("admin_dashboard") + "#services")


@app.route("/admin/save/projects", methods=["POST"])
@login_required
def admin_save_projects():
    data = load_data()
    projects = []
    index = 0

    while f"proj_title_fr_{index}" in request.form:
        projects.append({
            "id": index + 1,
            "title_fr": request.form.get(f"proj_title_fr_{index}", ""),
            "title_en": request.form.get(f"proj_title_en_{index}", ""),
            "desc_fr": request.form.get(f"proj_desc_fr_{index}", ""),
            "desc_en": request.form.get(f"proj_desc_en_{index}", ""),
            "tech": [
                item.strip()
                for item in request.form.get(f"proj_tech_{index}", "").split(",")
                if item.strip()
            ],
            "result_fr": request.form.get(f"proj_result_fr_{index}", ""),
            "result_en": request.form.get(f"proj_result_en_{index}", ""),
        })
        index += 1

    data["projects"] = projects
    save_data(data)
    flash("Projets sauvegardés ✓", "success")
    return redirect(url_for("admin_dashboard") + "#projects")


@app.route("/admin/save/contact", methods=["POST"])
@login_required
def admin_save_contact():
    data = load_data()
    data.setdefault("contact", {})

    for lang in ("fr", "en"):
        data["contact"].setdefault(lang, {})
        for field in (
            "heading",
            "subtitle",
            "name_label",
            "email_label",
            "message_label",
            "submit_label",
            "email",
            "linkedin",
            "github",
        ):
            key = f"{lang}_{field}"
            if key in request.form:
                data["contact"][lang][field] = request.form[key]

    save_data(data)
    flash("Section Contact sauvegardée ✓", "success")
    return redirect(url_for("admin_dashboard") + "#contact")


@app.route("/admin/project/add", methods=["POST"])
@login_required
def admin_add_project():
    data = load_data()
    projects = data.setdefault("projects", [])

    # Supports both the legacy list format and the V2 object format.
    if isinstance(projects, dict):
        items = projects.setdefault("items", [])
    else:
        items = projects

    existing_ids = [project.get("id", 0) for project in items if isinstance(project, dict)]
    new_project = {
        "id": max(existing_ids, default=0) + 1,
        "title_fr": request.form.get("title_fr", "Nouveau projet"),
        "title_en": request.form.get("title_en", "New project"),
        "desc_fr": request.form.get("desc_fr", ""),
        "desc_en": request.form.get("desc_en", ""),
        "tech": [
            item.strip()
            for item in request.form.get("tech", "").split(",")
            if item.strip()
        ],
        "result_fr": request.form.get("result_fr", ""),
        "result_en": request.form.get("result_en", ""),
    }

    items.append(new_project)
    save_data(data)
    flash("Projet ajouté ✓", "success")
    return redirect(url_for("admin_dashboard") + "#projects")


@app.route("/admin/project/delete/<int:project_id>", methods=["POST"])
@login_required
def admin_delete_project(project_id):
    data = load_data()
    projects = data.get("projects", [])
    items = projects.get("items", []) if isinstance(projects, dict) else projects

    if isinstance(items, list):
        items[:] = [project for project in items if project.get("id") != project_id]

    save_data(data)
    flash("Projet supprimé ✓", "success")
    return redirect(url_for("admin_dashboard") + "#projects")


if __name__ == "__main__":
    if not DATA_FILE.exists():
        save_data(get_default_data())

    app.run(
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
    )

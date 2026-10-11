"""
Tachyon application package.

Creates and configures the Flask application instance.
"""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask

from app import storage


def create_app(config: dict | None = None) -> Flask:
    """Application factory.

    Creates, configures, and returns a Flask application instance.

    Args:
        config: Optional mapping of configuration overrides.  Tests pass
                ``{"DATABASE": str(tmp_path / "test.db"), "TESTING": True}``
                here to get an isolated database.

    Returns:
        A fully configured :class:`flask.Flask` instance with the schema
        initialised and all blueprints registered.
    """
    app = Flask(__name__, instance_relative_config=True)

    # ------------------------------------------------------------------
    # Default configuration
    # ------------------------------------------------------------------
    app.config.from_mapping(
        SECRET_KEY="dev",
        # Default database lives inside Flask's instance folder so it is
        # outside the package tree and excluded by .gitignore.
        DATABASE=os.path.join(app.instance_path, "tachyon.db"),
        TESTING=False,
    )

    # Allow callers (and tests) to override any setting.
    if config is not None:
        app.config.from_mapping(config)

    # Ensure the instance folder exists (Flask does not create it).
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Initialise the database schema
    # ------------------------------------------------------------------
    storage.init_db(app.config["DATABASE"])

    # ------------------------------------------------------------------
    # Register blueprints
    # ------------------------------------------------------------------
    from app import routes  # noqa: PLC0415 (local import intentional)

    app.register_blueprint(routes.bp)

    return app

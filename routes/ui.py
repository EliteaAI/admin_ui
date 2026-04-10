#!/usr/bin/python3
# coding=utf-8

""" Route """

import json
import flask
from pathlib import Path

from pylon.core.tools import web, log  # pylint: disable=E0611,E0401

from werkzeug.exceptions import NotFound


class Route:  # pylint: disable=E1101,R0903

    @web.route('/', defaults={'sub_path': ''}, endpoint='route_admin_ui')
    @web.route('/<path:sub_path>', endpoint='route_admin_ui_sub_path')
    def admin_ui_react(self, sub_path: str):
        """ Serve admin UI SPA """
        from tools import auth  # pylint: disable=E0401,C0415
        #
        # Check admin access: user must have at least one administration mode permission
        #
        current_permissions = auth.resolve_permissions(mode='administration')
        if not current_permissions:
            return auth.access_denied_reply()
        #
        base_path = self.admin_base_path
        try:
            return self.bp.send_static_file(base_path.joinpath(sub_path))
        except NotFound:
            log.info(
                "Route route_admin_ui_sub_path: %s; serving: %s",
                sub_path, base_path.joinpath('index.html')
            )
            #
            admin_ui_config_data = self.get_admin_ui_config()
            #
            # Inject current user info for the profile icon
            #
            try:
                current_user = auth.current_user()
                admin_ui_config_data["user_name"] = current_user.get("name", "")
                admin_ui_config_data["user_email"] = current_user.get("email", "")
            except Exception:
                admin_ui_config_data["user_name"] = ""
                admin_ui_config_data["user_email"] = ""
            #
            vite_base_uri = admin_ui_config_data["vite_base_uri"]
            admin_ui_config = json.dumps(admin_ui_config_data)
            #
            idx_path = Path(self.bp.static_folder).joinpath(base_path, "index.html")
            #
            with open(idx_path, "r", encoding="utf-8") as idx_file:
                idx_data = idx_file.read()
            #
            idx_data = idx_data.replace(
                'src="./assets', f'src="{vite_base_uri}/assets'
            )
            idx_data = idx_data.replace(
                'href="./assets', f'href="{vite_base_uri}/assets'
            )
            idx_data = idx_data.replace(
                '<!-- admin_ui_config -->',
                f"<script>window.admin_ui_config = JSON.parse('{admin_ui_config}');</script>"
            )
            #
            response = flask.make_response(idx_data, 200)
            return response

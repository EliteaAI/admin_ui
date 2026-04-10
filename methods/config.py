#!/usr/bin/python3
# coding=utf-8

""" Method """

import flask  # pylint: disable=E0401

from pylon.core.tools import log  # pylint: disable=E0611,E0401,W0611
from pylon.core.tools import web  # pylint: disable=E0611,E0401,W0611


class Method:  # pylint: disable=E1101,R0903

    @web.method()
    def get_admin_ui_config(self):
        """ Get admin UI config """
        vite_base_uri = flask.url_for("admin_ui.route_admin_ui").rstrip("/")
        #
        vite_server_url = self.descriptor.config.get(
            "vite_server_url",
            flask.url_for(
                "admin_ui.route_admin_ui",
                _external=True,
            ).rstrip("/").replace("/admin/app", "/api/v1"),
        )
        #
        admin_ui_config_data = {
            "vite_server_url": vite_server_url,
            "vite_base_uri": vite_base_uri,
        }
        #
        # Merge any extra config from plugin config
        #
        extra_config_key = "extra_ui_config"
        if extra_config_key in self.descriptor.config:
            admin_ui_config_data.update(
                self.descriptor.config.get(extra_config_key, {})
            )
        #
        return admin_ui_config_data

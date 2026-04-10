#!/usr/bin/python3
# coding=utf-8

""" Module """

import re
from pathlib import Path

from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import module  # pylint: disable=E0611,E0401


class Module(module.ModuleModel):
    """ Pylon module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor
        #
        self.admin_base_path = Path(
            self.descriptor.config.get("base_path", "dist")
        )
        self.bp = None

    def init(self):
        """ Init module """
        log.info("Initializing module")
        #
        self.bp = self.descriptor.init_all(url_prefix="/admin/app")
        #
        # Register public rules for static assets (JS, CSS, images)
        # so the browser can load them without API auth headers
        #
        from tools import auth  # pylint: disable=E0401,C0415
        auth.add_public_rule({"uri": re.escape("/admin/app/") + ".*\\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|map)$"})

    def deinit(self):
        """ De-init module """
        log.info("De-initializing module")

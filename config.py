import os


class configuration:
    SQLALCHEMY_TRACK_MODIFICATIONS = True
    secret_key = os.urandom(24)
    DEBUG = True

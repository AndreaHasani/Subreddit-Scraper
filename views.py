from flask import Flask, render_template, request, session, jsonify, abort
from models import *
from app import application
from functions import *

@application.route("/", methods=["GET"])
def index():
    return render_template("index.html")

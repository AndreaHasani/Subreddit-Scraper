from app import socketio, application
from threading import Lock
from flask import session, request
from flask_socketio import Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect
import praw
import time
from datetime import datetime
from praw.models import util
from subprocess import call
import pprint

# This will need to have user login id insteed of random requests
running_process = {}


def submissionParser(submission, keywordsInclude, keywordsExclude):
    title = submission.title
    description = submission.selftext
    date = datetime.utcfromtimestamp(submission.created_utc)
    url = submission.url
    print(keywordsInclude)
    if not keywordsInclude:
        keywordsInclude = [None]
    if not keywordsExclude:
        keywordsExclude = [None]
    print(keywordsInclude)

    # Check if include keywords found in title or description
    if any(True if not word else word in title.lower() for word in keywordsInclude) or \
            any(True if not word else word in description.lower() for word in keywordsInclude):

        if not any(False if not word else word in title.lower() for word in keywordsExclude) and not \
                any(False if not word else word in description.lower() for word in keywordsExclude):

            # call(["notify-send.sh", "-a", " [Job Reddit]", title])
            return title, description, date, url


def background_thread(_id, data):
    selected_input = data['checked']
    subreddits_input = data['subreddits']

    with application.app_context():
        client_id = application.config["CLIENT_ID"]
        client_secret = application.config["CLIENT_SECRET"]
        password = application.config["PASSWORD"]
        username = application.config["USERNAME"]
        user_agent = application.config["USER_AGENT"]

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        password=password,
        user_agent=user_agent,
        username=username,)

    # subreddits_keyword_important = {"forhire": "hiring"}
    subreddits = {}
    for subreddit in selected_input:
        subreddits[subreddit] = {}
        subreddits[subreddit]["object_running"] = (reddit.subreddit(subreddit).
                                                   stream.submissions(pause_after=0))
        subreddits[subreddit] = {**subreddits[subreddit],
                                 **subreddits_input[subreddit]}

    # subreddits_data = {
    #     "forhire": {
    #         "titleKeyword": "hiring",
    #         "includeKeyword": ["website", "dev", "developer", "wordpress",
    #                            "client", "php", "css", "html", "python",
    #                            "programmer", "development", "docker", "linux",
    #                            "javascript"],
    #         "excludeKeyword": []
    #     },
    #     # "slavelabour": {
    #     #     "title_keyword": "task",
    #     #     "keywordInclude": ["website"],
    #     #     "keywordExclude": ["$"]
    #     # }
    # }

    print(subreddits)
    while running_process[_id] is True:
        for subreddit in subreddits:
            subreddit = subreddits[subreddit]
            excludeKeyword = subreddit['excludeKeyword']
            includeKeyword = subreddit['includeKeyword']
            titleKeyword = subreddit['titleKeyword']
            submission = next(subreddit['object_running'])
            if submission is None:
                break
            else:
                # if "[hiring]" in submission.title.lower():
                if any(True if not word else word in submission.title.lower()
                       for word in titleKeyword):
                    try:
                        title, desc, date, url = submissionParser(
                            submission, includeKeyword, excludeKeyword)
                        socketio.emit('background_response',
                                      {'status': 200,
                                       'title': title,
                                       'desc': desc,
                                       'date': str(date),
                                       'url': url},
                                      namespace='/reddit')
                    except Exception as e:
                        pass


class RedditIO(Namespace):
    def on_background_stop(self):
        _id = session['socket_id']
        print(_id)
        running_process[_id] = False
        emit('connection_response',
             {'data': 'Disconnected!', 'id': session['socket_id'],
              'running_process': running_process[_id]})

    def on_my_ping(self):
        emit('my_pong')

    def on_connect(self):
        session['socket_id'] = request.sid
        emit('my_response', {'data': 'Connected', 'count': 0})

    def on_background_start(self, data):
        _id = session['socket_id']
        try:
            if running_process[_id] is False:
                running_process[_id] = True
                socketio.start_background_task(
                    background_thread, _id, data)
        except KeyError:
            running_process[_id] = True
            socketio.start_background_task(
                background_thread, _id, data)

        emit('connection_response', {
             'data': 'Connected', 'id': session['socket_id']})

    def on_disconnect(self):
        _id = session['socket_id']
        running_process[_id] = False
        print('Client disconnected', request.sid)
        disconnect()


socketio.on_namespace(RedditIO('/reddit'))
# socketio.on_namespace(UpworkIO('/reddit'))

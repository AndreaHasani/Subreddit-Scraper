from app import socketio
from threading import Lock
from flask import session, request
from flask_socketio import Namespace, emit, join_room, leave_room, \
    close_room, rooms, disconnect
import praw
import time
from datetime import datetime
from praw.models import util
from subprocess import call

# This will need to have user login id insteed of random requests
running_process = {}


def submissionParser(submission, keywordsInclude, keywordsExclude, client_id,
                     client_secret, password, user_agent, username
                     ):
    title = submission.title
    description = submission.selftext
    date = datetime.utcfromtimestamp(submission.created_utc)
    url = submission.url

    # Check if include keywords found in title or description
    if any(word in title.lower() for word in keywordsInclude) or \
            any(word in description.lower() for word in keywordsInclude) and not \
            any(word in title.lower() for word in keywordsExclude) or not \
            any(word in description.lower() for word in keywordsExclude):

        # call(["notify-send.sh", "-a", " [Job Reddit]", title])
        return title, description, date, url


def background_thread(_id, subs, client_id, client_secret,
                      password, user_agent, username):
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        password=password,
        user_agent=user_agent,
        username=username,)

    subreddits = []
    subreddits_keyword_important = {"forhire": "hiring"}
    for sub in subs:
        subreddits.append(reddit.subreddit(sub).stream.submissions(
            pause_after=0)
        )

    include = []
    exclude = []

    while running_process[_id] is True:
        for subreddit in subreddits:
            submission = next(subreddit)
            if submission is None:
                break
            else:
                # if "[hiring]" in submission.title.lower():
                try:
                    title, desc, date, url = submissionParser(
                        submission, include, exclude)
                    socketio.emit('background_response',
                                  {'status': 200,
                                   'title': title,
                                   'desc': desc,
                                   'date': str(date),
                                   'url': url},
                                  namespace='/reddit')
                except Exception as e:
                    raise


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

    def on_background_start(self, subs):
        _id = session['socket_id']
        try:
            if running_process[_id] is False:
                running_process[_id] = True
                socketio.start_background_task(
                    background_thread, _id, subs['subs'])
        except KeyError:
            running_process[_id] = True
            socketio.start_background_task(
                background_thread, _id, subs['subs'])

        emit('connection_response', {
             'data': 'Connected', 'id': session['socket_id']})

    def on_disconnect(self):
        _id = session['socket_id']
        running_process[_id] = False
        print('Client disconnected', request.sid)
        disconnect()


socketio.on_namespace(RedditIO('/reddit'))
# socketio.on_namespace(UpworkIO('/reddit'))

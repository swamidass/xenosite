import json
import os
import sys
import requests
import base64
from subprocess import Popen
import time

# Popen(['uwsgi', "--ini", "uwsgi.ini", "--wsgi-file", "epoxidation.py"], stdout=sys.stdin, stderr=sys.stderr)

def main(event, context):


    try:
   #     resp = requests.request(http_method, url + path, headers=headers,
   #                         data=body)
    #    body = resp.json()

        response = {
            "statusCode": 200, # resp.status_code,
            "body": {"event": event, "message": "Proxy hello!"}
        }

    except Exception as E:
        print('Proxy connection failed.')
        response = {
            "statusCode": 500,
            "body": "proxy:main: " + str(E)
        }

    return response

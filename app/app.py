"""
This is a Python Web Service using Flask that returns results for AI/ML Web Services
using TensorFlow, Keras, and scikit-learn. Both TensorFlow and Keras uses a lot of
CPU so originally these services were installed on another server to avoid using to
many resources on the main server. As of 2022 it was migrated to the main server
along with several other URLs because it does not get enough traffic to justify
a separate server.

Server and Examples:
    https://ai-ml.dataformsjs.com/
    https://www.dataformsjs.com/examples/image-classification-vue.htm#/en/
    https://www.dataformsjs.com/examples/binary-classification-vue.htm#/en/

Server Setup Docs for running as a Standalone Server:
    Website\docs\Python Webserver Setup for AI_ML Functions.txt
    https://github.com/dataformsjs/website/blob/master/docs/Python%20Webserver%20Setup%20for%20AI_ML%20Functions.txt

Production Server Setup (shared with at least 4 other servers):
    https://github.com/fastsitephp/fastsitephp/blob/master/docs/server-setup/server-setup.sh

Build Script for model file [pima-indians-diabetes.sklearn]:
    Website\scripts\ai-ml-pima-indians-diabetes-build.py

Running this file. Once all dependencies are installed from the server setup docs
then you can run this file directly with Python or by using the standard Flask CLI:
    python3 app.py
    FLASK_APP=app.py flask run

This app is intended for as a free demo on and runs from a single server. If using similar
code for a large site with many simultaneous users you would likely want to run many
servers (GPU instead of CPU) behind a load balancer and consider scenarios such as
Rate Limiting and Memory Caching results of predictions that might be repeated.
"""
# System Imports
import os
import sys
import traceback
import tempfile
import json
import pickle
import secrets
from datetime import datetime
from functools import wraps

# Flask Import
from flask import Flask, request, send_file, Response
from flask_cors import CORS

# Data and Machine Learning Libraries
import numpy as np
import tensorflow as tf
from keras.applications.resnet50 import ResNet50
from keras.preprocessing import image
from keras.applications.resnet50 import preprocess_input, decode_predictions
from sklearn.linear_model import LogisticRegression

# ------------------------------------------------------------------
# App Setup
# AI/ML Models can take a long time to load so they are loaded
# only once when the site is first started and not on each request.
# ------------------------------------------------------------------

# Start Flask and setup CORS Support
app = Flask(__name__)
CORS(app)

# Load the Model for Image Classification (ResNet50 using pre-built ImageNet).
# Expect 10 - 30 seconds for the model to load. Weights are downloaded
# and saved to the local computer on first use.
start = datetime.now()
print(f'Loading Model at {start}')
model_resnet50 = ResNet50(weights='imagenet')
end = datetime.now()
seconds = (end - start).total_seconds()
print(f'ResNet50 Model Loaded at {end} in {seconds} seconds')

# When using a Webserver (Gunicorn, waitress, etc) the requests will be
# multi-threaded so the following line along with [with graph.as_default():]
# is needed in order for the service to work when using TensorFlow.
# This applies to older versions of Tensorflow such as `1.13.1`.
USE_GRAPH = False
if USE_GRAPH:
    graph = tf.get_default_graph()

# Load model for the Binary Classification Demo.
# Model was created by [website\scripts\ai-ml-pima-indians-diabetes-build.py]
# Loading this requires [sklearn] to be installed but it doesn't have
# to be imported at the top of this file. If you are testing locally
# then generate the model first or download from CDN to this directory.
# This will also work if the [static-files] repository is downloaded
# for full local setup. See additional info in server setup docs.
# The model is available in two formats. JSON is used with recent versions
# of sklearn, see comments in: [website\scripts\ai-ml-pima-indians-diabetes-convert-model.py]
USE_JSON_FILE = True
cur_dir = os.path.dirname(os.path.abspath(__file__))
file_name = 'pima-indians-diabetes.json' if USE_JSON_FILE else 'pima-indians-diabetes.sklearn'
model_path = os.path.join(cur_dir, file_name)
if not os.path.exists(model_path):
    model_path = os.path.join(cur_dir, '../../static-files/ai_ml/models', file_name)
if USE_JSON_FILE:
    with open(model_path, 'r') as file:
        data = json.load(file)
    model_pima = LogisticRegression(data['params'])
    for name, value in data.items():
        if name.endswith('_'):
            setattr(model_pima, name, np.array(value))
else:
    with open(model_path, 'rb') as file:
        model_pima = pickle.load(file)
print(f'sklearn Model Loaded from file: ' + model_path)

# ----------------------------------------------------------------------------
# General Helper Functions
# ----------------------------------------------------------------------------

def json_encoder(obj):
    """
    JSON encoder for objects not handled by default
    """
    if isinstance(obj, np.generic):
        return np.asscalar(obj)
    # The following are not used by this app but commonly used by db apps.
    # For Decimal [from decimal import Decimal] at the top of the file.
    #
    # if isinstance(obj, datetime):
    #    return obj.isoformat()
    # if isinstance(obj, Decimal):
    #    return float(obj)
    raise TypeError('Type {obj.__class__} is not handled for encoding'.format(**locals()))


def json_response(func):
    """
    When added to a route the response will be sent as a JSON Response.
    This route allows the custom [json_encoder] function to handle
    common data types such as [datetime, Decimal] that are not
    handled by jsonify().
    """
    @wraps(func)
    def create_json_response(*args, **kwargs):
        """ Call the decorated function and specify 'Content-Type' header """
        resp = func(*args, **kwargs)
        json_text = json.dumps(resp, default=json_encoder)
        return Response(json_text, content_type='application/json')
    return create_json_response

# ----------------------------------------------------------------------------
# Machine Learning Functions
# ----------------------------------------------------------------------------

def resnet50_prediction(model, file_path):
    """
    Image Classification using Keras and TensorFlow. The first result
    and all labels with a probability 10% or higher are returned.
    """
    img = image.load_img(file_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    if USE_GRAPH:
        with graph.as_default():
            preds = model.predict(x)
    else:
        preds = model.predict(x)
    predictions = decode_predictions(preds, top=5)[0]
    results = []
    for (index, (wordnet, label, probability)) in enumerate(predictions):
        if index == 0 or probability >= 0.1:
            results.append({
                'wordnet': wordnet,
                'label': label,
                'probability': probability,
            })
    return results

# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------

@app.route("/")
def home():
    # For local development use [ai-ml-demo.htm] otherwise
    # look for [index.htm] in the same directory.
    path = os.path.join(cur_dir, 'views/ai-ml-demo.htm')
    if os.path.exists(path):
        return send_file(path)
    return send_file('index.htm')


@app.route("/predict/resnet50", methods = ['POST'])
@json_response
def predict_resnet50():
    # Read image from Form Post and Save to Temp Dir.
    # This is using a random hex string for the file name. The image
    # type is determined from file contents by Keras/Pillow rather than
    # file extension so it is not needed. If the code were using the actual
    # name the code similar to the commented version could be used however
    # additional safety checks would be needed for duplicate file names, etc.
    #
    # from werkzeug import secure_filename
    # file_path = os.path.join(tempfile.gettempdir(), secure_filename(file.name))
    #
    file = request.files['file']
    file_path = os.path.join(tempfile.gettempdir(), secrets.token_hex(10))
    file.save(file_path)

    # Predict, delete temp file, and return result
    result = {'predictions': resnet50_prediction(model_resnet50, file_path)}
    os.remove(file_path)
    return result


@app.route("/predict/pima-indians-diabetes", methods = ['POST'])
@json_response
def predict_pima():
    # Read record values from JSON post, format looks like this:
    #     {"values":[1,89,66,23,94,28.1,0.167,21]}
    # Or if submitted by the Entry Form demo they will come in as an object:
    #     {"pregnancies":"1","glucose":"89",...
    #
    # This service is a simple demo and assumes all values are filled in.
    # The actual data has some 0/null values. For a production system
    # they could be handled using a known median value for the column
    # or other methods.
    json = request.get_json()
    if 'values' in json:
        record = json['values']
    else:
        fields = ['pregnancies', 'glucose', 'bloodPressure', 'skinThickness', 'insulin', 'bmi', 'diabetesPedigreeFunction', 'age']
        record = []
        for field in fields:
            value = json[field]
            value = float(value) if '.' in value else int(value)
            record.append(value)

    # Predict
    prediction = model_pima.predict([record])[0]
    probability = model_pima.predict_proba([record])[:,1][0]
    return {'prediction': prediction, 'probability': probability}

# ----------------------------------------------------------------------
# Error Handling
# These functions return detailed info and are not suitable for
# many public-facing production sites due to the amount of info
# displayed. They are used here because the site is fully open-source
# so if any errors occur then the info is helpful to solve errors.
# ----------------------------------------------------------------------

@app.errorhandler(404)
def page_not_found(e):
    res = 'Page not found: ' + str(e)
    res = res + '\n' + str(request)
    return res, 404, {'Content-Type': 'text/plain'}

@app.errorhandler(500)
def error_handler(e):
    res = 'Server Error: ' + str(type(e)) + ' ' + str(e)
    res = res + '\n' + ('-' * 80)
    _, _, tb = sys.exc_info()
    res = res + '\n' + ''.join(traceback.format_list(traceback.extract_tb(tb)))
    res = res + ('-' * 80)
    res = res + '\n' + str(request)
    return res, 500, {'Content-Type': 'text/plain'}

# ----------------------------------------------------------------------------
# Start of Script
# ----------------------------------------------------------------------------

if __name__ == '__main__':
    # (threaded=False) is required when running Flask
    # directly and not using a webserver.
    app.run(threaded=False)

# Simple script to test the model file created by [ai-ml-pima-indians-diabetes-build.py]
import os
import pickle
import json
import numpy as np
from sklearn.linear_model import LogisticRegression

# Two options exist for the saved file format, see [ai-ml-pima-indians-diabetes-convert-model.py]
USE_JSON_FILE = True

# File Location
cur_dir = os.path.dirname(os.path.abspath(__file__))
file_name = 'pima-indians-diabetes.json' if USE_JSON_FILE else 'pima-indians-diabetes.sklearn'
model_path = os.path.join(cur_dir, file_name)

# Open file
if USE_JSON_FILE:
    with open(model_path, 'r') as file:
        data = json.load(file)
    model = LogisticRegression(data['params'])
    for name, value in data.items():
        if name.endswith('_'):
            setattr(model, name, np.array(value))
else:
    with open(model_path, 'rb') as file:
        model = pickle.load(file)

# Check model props
print(model_path)
print(model.get_params())
print(model.classes_)
print(model.coef_)
print(model.intercept_)
print(model.n_iter_)

# Manually test several records from the file
print('-' * 80)
test_records = [
    # [1,89,66,23,94,28.1,0.167,21], # 0
    # [5,166,72,19,175,25.8,0.587,51], # 1
    # [10,115,0,0,0,35.3,0.134,29], # 0

    [7,195,70,33,145,25.1,0.163,55]
]
print(model.predict(test_records))
print(model.predict_proba(test_records)[:,1])

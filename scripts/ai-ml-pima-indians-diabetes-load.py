# Simple script to test the model file created by [ai-ml-pima-indians-diabetes-build.py]
import os
import pickle

# File Location
cur_dir = os.path.dirname(os.path.abspath(__file__))
file_name = 'pima-indians-diabetes.sklearn'
model_path = os.path.join(cur_dir, file_name)

# Open file
with open(model_path, 'rb') as file:
    model = pickle.load(file)

# Check model props
print(model.coef_)

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

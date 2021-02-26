"""
Originally the model file created by [ai-ml-pima-indians-diabetes-build.py]
used Python pickle format which is a binary format and a common method
for saving sklearn models. Originally the model was created in version
0.21.3 and later after a server update using 0.24.1 the pickle model
was found to not work with latest scikit-learn due to a breaking namespace
change. This script converts the model from binary pickle format to JSON
so that it can be easily shared without breaking.
"""
import os
import pickle
import json

# https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html#sklearn.linear_model.LogisticRegression
# https://scikit-learn.org/stable/modules/model_persistence.html

# Related:
# https://github.com/mlrequest/sklearn-json
# https://stackoverflow.com/questions/48328012/python-scikit-learn-to-json

# File Location
cur_dir = os.path.dirname(os.path.abspath(__file__))
file_name = 'pima-indians-diabetes.sklearn'
model_path = os.path.join(cur_dir, file_name)

# Open file
with open(model_path, 'rb') as file:
    model = pickle.load(file)

# Convert Model from Pickle to Plain Dictionary and save file in JSON format
# sklearn attributes end with "_" but not "__" (example: "coef_") so this
# script is designed to be generic and handle all (or many) sklearn classes.
model2 = {
    'class': type(model).__name__,
    'params': model.get_params(),
}
attrs = [attr for attr in dir(model) if attr.endswith('_') and not attr.endswith('__')]
for attr in attrs:
    model2[attr] = getattr(model, attr).tolist()

save_path = model_path.replace('.sklearn', '.json')
with open(save_path, 'w') as f:
    f.write(json.dumps(model2, indent=4))

# print(model.coef_)
# print(model.classes_)
# print(model.intercept_)
# print(model.n_iter_)


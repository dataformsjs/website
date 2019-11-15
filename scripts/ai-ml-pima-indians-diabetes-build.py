"""
This file is used to generate the model file [pima-indians-diabetes.sklearn]
which is used on a demo page. Near the top of this file is a section
for Script Parameters that can be modified to change how the model is built.
Additionally this file is intended to be edited and ran from a Code Editor.

During development the highest tested accuracy was 92.86% however regardless
of the model selected when using default parameters cross validation is
typically around 76%. This file contains comments to describe the code
but general knowledge of ML and using sklearn is assumed.

Dependencies:
python -m pip install scikit-learn
python -m pip install pandas
python -m pip install numpy

The CSV file needs to be downloaded and saved as 'pima-indians-diabetes.csv'
in the same directory as this script in order to run.

Related Links:
https://www.kaggle.com/uciml/pima-indians-diabetes-database
https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv (File Download)

Author: Conrad Sollitt
"""
import os
import pickle
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.linear_model import LogisticRegression

# =================================================
# Script Parameters

NULL_METHOD = 'median'
# NULL_METHOD = 'drop-rows'
# NULL_METHOD = 'ignore'

USE_HYPER_PARAMETERS = False
PRINT_SAMLE_RECORDS = False
TEST_ALL_RECORDS = True

SCORING = None # Default of 'accuracy'
# SCORING = 'roc_auc'

LOOP_COUNT = 1
# LOOP_COUNT = 100
# LOOP_COUNT = 20000
# =================================================

# [sklearn] can generate many FutureWarning statements so hide them
warnings.filterwarnings('ignore')

# File Location
# Either current directory or '../app_data/'
cur_dir = os.path.dirname(os.path.abspath(__file__))
file_name = 'pima-indians-diabetes.csv'
file_path = os.path.join(cur_dir, file_name)
if not os.path.exists(file_path):
    file_path = os.path.join(cur_dir, '..', 'app_data', file_name)
if not os.path.exists(file_path):
    print(f'Error - Model file [{file_name}] was not found.')
    exit()
model_path = file_path.replace('.csv', '.sklearn')

# Read CSV Data
df = pd.read_csv(file_path, header=None)
print(file_name)
print(f'(Rows, Cols) = {df.shape}')
print('-' * 80)

# Add Column Names to the Data Set.
# Not required but included here to make the code easier to read.
df.columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']

# Show the first 10 rows
if PRINT_SAMLE_RECORDS:
    print(df.head(n=10))

# Replace Null/0 Values
if NULL_METHOD == 'drop-rows' or NULL_METHOD == 'median':
    cols = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    df[cols] = df[cols].replace(0, np.NaN)
    if NULL_METHOD == 'drop-rows':
        df.dropna(inplace=True)
    else:
        for col in cols:
            df[col] = df[col].fillna(value=df[col].median(skipna=True))

# Show first 10 rows and other info after update
if PRINT_SAMLE_RECORDS:
    print(df.head(n=10))
    print(df.describe())

# Split data based on the Target Column
y = df['Outcome']
X = df.drop(columns=['Outcome'])

# Optional Hyperparameter Tuning
if USE_HYPER_PARAMETERS:
    param_grid = [
        { 'C': [0.000001, 0.00001, 0.0001, .001, .01, .1, 1, 10, 100, 1000, 10000], },
        # { 'C': [1E-6, 1E-5, 1E-4, 1E-3, 1E-2, 1E-1, 1, 1E+1, 1E+2, 1E+3, 1E+4, 1E+5, 1E+6]},
        # { 'C': np.logspace(-4, 4, 8), },
        # { 'C': [.001, .01, .1, 1, 10, 100], },
        # { 'C': [.001, .01, .1, 1, 10, 100], 'solver': ['newton-cg', 'lbfgs', 'liblinear'] },
        # { 'C': [.001, .01, .1, 1, 10, 100], 'penalty': ['l1', 'l2'], },
    ]

    clf = LogisticRegression()
    grid = GridSearchCV(estimator=clf, param_grid=param_grid, scoring=SCORING)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25)
    grid.fit(X_train, y_train)

    # Summarize the results of the grid search
    print('-' * 80)
    print("Best score: %0.2f%%" % (100 * grid.best_score_))
    print("Best estimator for parameter C: %f" % (grid.best_estimator_.C))
    # print("Best estimator for parameter solver: %s" % (grid.best_estimator_.solver))
    # print("Best estimator for parameter penalty: %s" % (grid.best_estimator_.penalty))
    print(grid.best_estimator_)
    print('-' * 80)

# Build and save final model.
# Run the model many times and save the best result. Note - in general running
# many loops has little impact on overall model quality for this dataset
# even though the accuracy statistic improves as the loops run. If running
# many times (10,000+) accuracy wil often increase by about 10+% while
# true postives and false negatives may gain an increase of only 1-2%.
results = []
max_model = 0
for count in range(LOOP_COUNT):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25)
    if USE_HYPER_PARAMETERS:
        clf = LogisticRegression(C=grid.best_estimator_.C)
        # clf = LogisticRegression(C=grid.best_estimator_.C, solver=grid.best_estimator_.solver)
        # clf = LogisticRegression(C=grid.best_estimator_.C, penalty=grid.best_estimator_.penalty)
    else:
        clf = LogisticRegression()
    clf.fit(X_train, y_train)
    y_eval = clf.predict(X_test)
    acc = sum(y_eval == y_test) / float(len(y_test))
    # acc = clf.score(X_test, y_test) # provides the same results
    results.append(acc)
    if count % 500 == 0:
        print(f'Evalulated {count} models at {datetime.now()}')
    if acc > max_model:
        max_model = acc
        with open(model_path, 'wb') as file:
            pickle.dump(clf, file)
        print('Saved new model with accuracy: %.2f%%' % (100 * acc))
        print(clf.coef_)

# Summary
print('-' * 80)
print('LogisticRegression() [Loops: {0}], [Hyperparameters: {1}], [Null Method: {2}]'.format(LOOP_COUNT, USE_HYPER_PARAMETERS, NULL_METHOD))
if LOOP_COUNT == 1:
    print('Result: ' + str(results[0]))
else:
    print('Min: ' + str(np.min(results)))
    print('Max: ' + str(np.max(results)))
    print('Mean: ' + str(np.mean(results)))
    print('Avg: ' + str(np.average(results)))
    print('Std: ' + str(np.std(results)))

# Cross Validation
print('-' * 80)
scores = cross_val_score(clf, X, y, cv=10, scoring=SCORING)
print(scores)
print("Cross Validation Score | Accuracy: %0.2f%% (+/- %0.2f%%)" % (100 * scores.mean(), 100 * scores.std() * 2))

# Manually test several records from the file
print('-' * 80)
test_records = [
    [1,89,66,23,94,28.1,0.167,21], # 0
    [5,166,72,19,175,25.8,0.587,51], # 1
    [10,115,0,0,0,35.3,0.134,29], # 0
    # The above record contains many 0 (null) fields and in testing will often predict either 0 or 1
]
print(clf.predict(test_records))
# print(clf.predict_proba(test_records))
print(clf.predict_proba(test_records)[:,1])

# Calculate Confusion Matrix for all records in the dataset.
if TEST_ALL_RECORDS:
    print('-' * 80)
    print('Result of testing all records:')
    postives = df[df['Outcome'] == 1].drop(columns=['Outcome'])
    negatives = df[df['Outcome'] == 0].drop(columns=['Outcome'])

    res_pos = clf.predict(postives)
    total_positives = len(res_pos)
    true_positives = len([item for item in res_pos if item == 1])
    false_negatives = len([item for item in res_pos if item == 0])

    res_neg = clf.predict(negatives)
    total_negatives = len(res_neg)
    true_negatives = len([item for item in res_neg if item == 0])
    false_positives = len([item for item in res_neg if item == 1])

    print(f'True Positives: {true_positives} of {total_positives} ({round(true_positives / total_positives * 100, 2)} %)')
    print(f'False Negatives: {false_negatives} of {total_positives} ({round(false_negatives / total_positives * 100, 2)} %)')
    print(f'True Negatives: {true_negatives} of {total_negatives} ({round(true_negatives / total_negatives * 100, 2)} %)')
    print(f'False Positives: {false_positives} of {total_negatives} ({round(false_positives / total_negatives * 100, 2)} %)')

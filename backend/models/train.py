'''
Replicates train_model.ipynb
Runs the training process from the command line, useful for automation.
'''
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn import preprocessing
import joblib

def train_model():
    try:
        data = pd.read_csv('models/ASD_data.csv')
        print("Dataset loaded successfully. Shape:", data.shape)
    except FileNotFoundError:
        print("Error: ASD_data.csv not found. Please ensure the file exists in the working directory.")
        return
    
    features = ['gsr_max', 'gsr_min', 'gsr_mean', 'gsr_sd', 'hrate_mean', 'temp_avg']
    target = 'class'
    
    missing_cols = [col for col in features + [target] if col not in data.columns]
    if missing_cols:
        print(f"Error: Missing columns in dataset: {missing_cols}")
        return
    
    X = data[features]
    y = data[target]
    
    print('Missing values:\n', X.isnull().sum())
    X = X.fillna(X.mean())

    Q1 = X.quantile(0.25)
    Q3 = X.quantile(0.75)
    IQR = Q3 - Q1
    outlier_mask = ~((X < (Q1 - 1.5 * IQR)) | (X > (Q3 + 1.5 * IQR))).any(axis=1)
    X = X[outlier_mask]
    y = y[outlier_mask]
    print(f"Dataset shape after outlier removal: {X.shape}")
    

    scaler = preprocessing.MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    print(f"Training set shape: {X_train.shape}, Test set shape: {X_test.shape}")
    
    # Train RF Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    print("Model training completed.")
    
    # Model Evaluation
    y_pred = model.predict(X_test)
    accuracy = metrics.accuracy_score(y_test, y_pred)
    precision = metrics.precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = metrics.recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = metrics.f1_score(y_test, y_pred, average='weighted', zero_division=0)
    
    print('Evaluation Metrics:')
    print(f'Accuracy: {accuracy:.4f}')
    print(f'Precision: {precision:.4f}')
    print(f'Recall: {recall:.4f}')
    print(f'F1-score: {f1:.4f}')
    
    # Save model
    try:
        joblib.dump(model, 'models/auticare_model.pkl')
        joblib.dump(scaler, 'models/scaler.pkl')
        print("Model and scaler saved successfully as 'auticare_model.pkl' and 'scaler.pkl'.")
    except Exception as e:
        print(f"Error saving model or scaler: {e}")
        return

if __name__ == "__main__":
    train_model()
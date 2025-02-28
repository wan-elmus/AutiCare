'''
Replicates train_model.ipynb
Runs the training process from the command line, useful for automation.
'''
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn import preprocessing
import joblib

def train_model():
    # Load the data
    data = pd.read_csv('ASD_data.csv')
    
    # Define features and target
    features = ['gsr_max', 'gsr_min', 'gsr_mean', 'gsr_sd', 'hrate_mean', 'temp_avg']
    target = 'class'
    
    X = data[features]
    y = data[target]
    
    # Data Cleaning: Check for missing values
    print('Missing values:\n', X.isnull().sum())
    X = X.fillna(X.mean())  # Fill missing values with mean
    
    # Outlier Detection using IQR
    Q1 = X.quantile(0.25)
    Q3 = X.quantile(0.75)
    IQR = Q3 - Q1
    X = X[~((X < (Q1 - 1.5 * IQR)) | (X > (Q3 + 1.5 * IQR))).any(axis=1)]
    y = y[X.index]
    
    # Normalize the data
    scaler = preprocessing.MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Train the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test)
    print('Accuracy:', metrics.accuracy_score(y_test, y_pred))
    print('Precision:', metrics.precision_score(y_test, y_pred, average='weighted'))
    print('Recall:', metrics.recall_score(y_test, y_pred, average='weighted'))
    print('F1-score:', metrics.f1_score(y_test, y_pred, average='weighted'))
    
    # Save the model and scaler
    joblib.dump(model, 'auticare_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Model and scaler saved successfully.")

if __name__ == "__main__":
    train_model()
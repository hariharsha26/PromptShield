import pandas as pd
import os

train_path = r'c:\Users\harih\OneDrive\Desktop\AU PS\model\training_dataset.xlsx'
test_path = r'c:\Users\harih\OneDrive\Desktop\AU PS\model\testing_dataset.xlsx'

def analyze(path, name):
    print(f"\n=== {name} Analysis ===")
    if not os.path.exists(path):
        print(f"Error: {path} not found.")
        return
    df = pd.read_excel(path)
    print(f"Shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nAction Distribution:")
    print(df['action'].value_counts())
    print("\nRisk Level Stats:")
    print(df['risk_level'].describe())
    if 'category' in df.columns:
        print("\nCategory Distribution:")
        print(df['category'].value_counts())

analyze(train_path, "Training Dataset")
analyze(test_path, "Testing Dataset")

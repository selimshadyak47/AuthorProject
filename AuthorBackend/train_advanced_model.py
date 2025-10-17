import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix
import shap
import joblib
import json
import os
import matplotlib.pyplot as plt
import seaborn as sns

def extract_treatment_features(df):
    """Extract features from treatment history text"""
    print("Extracting treatment features...")
    
    # Count different treatment types
    treatment_types = [
        'physical_therapy', 'otc_nsaids', 'prescription_nsaids',
        'steroid_injection', 'chiropractic', 'massage',
        'acupuncture', 'nerve_block', 'radiofrequency'
    ]
    
    for treatment in treatment_types:
        df[f'tried_{treatment}'] = df['treatment_history'].str.contains(treatment).astype(int)
    
    # Extract PT weeks specifically
    def get_pt_weeks(history):
        if 'physical_therapy' not in history:
            return 0
        try:
            pt_part = [t for t in history.split('|') if 'physical_therapy' in t][0]
            # token like physical_therapy_8w -> split from right
            last_token = pt_part.rsplit('_', 1)[-1]
            return int(last_token.replace('w', '')) if last_token.endswith('w') else int(last_token)
        except:
            return 0
    
    df['pt_weeks_completed'] = df['treatment_history'].apply(get_pt_weeks)
    
    # Count total treatments
    df['total_treatments_tried'] = df['treatment_history'].apply(
        lambda x: len(x.split('|')) if x != 'none' else 0
    )
    
    # Treatment diversity
    df['treatment_diversity'] = df['treatment_history'].apply(
        lambda x: len(set([t.split('_')[0] for t in x.split('|')])) if x != 'none' else 0
    )
    
    return df

def engineer_features(df):
    """Create advanced engineered features"""
    print("Engineering advanced features...")
    
    # Extract treatment features first
    df = extract_treatment_features(df)
    
    # Documentation quality score
    doc_features = [
        'uses_medical_necessity', 'uses_failed_conservative',
        'uses_quality_of_life', 'uses_activities_daily_living',
        'cites_medical_literature', 'includes_objective_findings'
    ]
    df['documentation_quality_score'] = df[doc_features].sum(axis=1) / len(doc_features)
    
    # Pain severity category
    df['pain_severity'] = pd.cut(
        df['pain_current'],
        bins=[0, 3, 6, 8, 10],
        labels=['mild', 'moderate', 'severe', 'extreme']
    )
    
    # Chronicity flag
    df['is_chronic'] = (df['diagnosis_months'] >= 3).astype(int)
    
    # Complete conservative treatment flag
    df['complete_conservative'] = (
        (df['pt_weeks_completed'] >= 6) &
        (df['tried_prescription_nsaids'] == 1) &
        (df['total_treatments_tried'] >= 3)
    ).astype(int)
    
    # Work impact severity
    work_impact_map = {
        'working_full': 0,
        'light_duty': 1,
        'cannot_work': 2,
        'retired': 0,
        'unemployed': 0
    }
    df['work_impact_score'] = df['work_status'].map(work_impact_map)
    
    # Imaging-clinical correlation
    df['imaging_symptoms_match'] = (
        ((df['imaging_findings'] == 'severe') & (df['pain_current'] >= 8)) |
        ((df['imaging_findings'] == 'moderate') & (df['pain_current'] >= 6)) |
        ((df['imaging_findings'] == 'mild') & (df['pain_current'] >= 4))
    ).astype(int)
    
    # Red flags combination
    df['red_flags'] = (
        df['has_neurological_symptoms'].astype(int) +
        (df['pain_trend'] == 'worsening').astype(int) +
        (df['functional_limitations'] == 'severe').astype(int)
    )
    
    # Friday submission flag
    df['is_friday'] = (df['submission_day_of_week'] == 'Friday').astype(int)
    
    # End of year flag
    df['is_q4'] = (df['quarter'] == 'Q4').astype(int)
    
    # Age categories
    df['age_category'] = pd.cut(
        df['patient_age'],
        bins=[0, 40, 65, 100],
        labels=['young', 'middle', 'elderly']
    )
    
    # Interaction features
    df['pt_weeks_x_pain'] = df['pt_weeks_completed'] * df['pain_current']
    df['documentation_x_treatments'] = df['documentation_quality_score'] * df['total_treatments_tried']
    df['chronic_x_severe'] = df['is_chronic'] * (df['pain_current'] >= 7).astype(int)
    
    return df

def prepare_model_data(df):
    """Prepare data for model training"""
    print("Preparing data for model...")
    
    # Engineer features
    df = engineer_features(df)
    
    # Encode categorical variables
    label_encoders = {}
    categorical_columns = [
        'payer', 'procedure_category', 'procedure_code',
        'primary_diagnosis', 'pain_severity', 'pain_trend',
        'imaging_findings', 'functional_limitations',
        'work_status', 'provider_specialty', 'age_category',
        'submission_day_of_week', 'quarter'
    ]
    
    for col in categorical_columns:
        if col in df.columns:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le
    
    # Select features for model
    feature_cols = []
    
    # Encoded categorical features
    for col in categorical_columns:
        if f'{col}_encoded' in df.columns:
            feature_cols.append(f'{col}_encoded')
    
    # Numerical features
    numerical_features = [
        'patient_age', 'diagnosis_months', 'pt_weeks_completed',
        'total_treatments_tried', 'treatment_diversity',
        'pain_initial', 'pain_current', 'pain_average', 'pain_max',
        'documentation_quality_score', 'documentation_completeness',
        'letter_word_count', 'work_impact_score', 'red_flags',
        'previous_denials', 'appeals_attempted',
        'is_chronic', 'complete_conservative', 'imaging_symptoms_match',
        'is_friday', 'is_q4', 'pt_weeks_x_pain',
        'documentation_x_treatments', 'chronic_x_severe'
    ]
    
    # Boolean features
    boolean_features = [
        'pain_documented_consistently', 'has_neurological_symptoms',
        'uses_medical_necessity', 'uses_failed_conservative',
        'uses_quality_of_life', 'uses_activities_daily_living',
        'cites_medical_literature', 'includes_objective_findings',
        'includes_imaging_results'
    ]
    
    # Treatment flags
    treatment_flags = [col for col in df.columns if col.startswith('tried_')]
    
    # Combine all features
    feature_cols.extend(numerical_features)
    feature_cols.extend(boolean_features)
    feature_cols.extend(treatment_flags)
    
    # Convert booleans to int
    for col in boolean_features:
        if col in df.columns:
            df[col] = df[col].astype(int)
    
    # Remove any features not in dataframe
    feature_cols = [col for col in feature_cols if col in df.columns]
    
    return df, feature_cols, label_encoders

def train_advanced_model(df, feature_cols):
    """Train the advanced LightGBM model"""
    print("\n" + "="*60)
    print("TRAINING ADVANCED ML MODEL")
    print("="*60)
    
    # Prepare data
    X = df[feature_cols]
    y = df['approved']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\nData Split:")
    print(f"  Training: {len(X_train)} cases")
    print(f"  Testing: {len(X_test)} cases")
    print(f"  Features: {len(feature_cols)}")
    
    # Advanced LightGBM parameters
    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'num_leaves': 63,
        'max_depth': 8,
        'learning_rate': 0.02,
        'feature_fraction': 0.7,
        'bagging_fraction': 0.7,
        'bagging_freq': 5,
        'min_data_in_leaf': 20,
        'min_gain_to_split': 0.001,
        'lambda_l1': 0.1,
        'lambda_l2': 0.1,
        'verbose': -1,
        'random_state': 42,
        'n_jobs': -1
    }
    
    # Create datasets
    train_data = lgb.Dataset(X_train, label=y_train)
    valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
    
    # Train model
    print("\nTraining model...")
    model = lgb.train(
        params,
        train_data,
        valid_sets=[valid_data],
        num_boost_round=500,
        callbacks=[
            lgb.early_stopping(50),
            lgb.log_evaluation(100)
        ]
    )
    
    # Make predictions
    train_pred = model.predict(X_train, num_iteration=model.best_iteration)
    test_pred = model.predict(X_test, num_iteration=model.best_iteration)
    
    # Calculate metrics
    train_auc = roc_auc_score(y_train, train_pred)
    test_auc = roc_auc_score(y_test, test_pred)
    
    print(f"\nModel Performance:")
    print(f"  Training AUC: {train_auc:.4f}")
    print(f"  Test AUC: {test_auc:.4f}")
    print(f"  Overfitting: {(train_auc - test_auc):.4f}")
    
    # Classification report
    test_pred_binary = (test_pred >= 0.5).astype(int)
    print("\nClassification Report:")
    print(classification_report(y_test, test_pred_binary))
    
    # Confusion matrix
    cm = confusion_matrix(y_test, test_pred_binary)
    print("\nConfusion Matrix:")
    print(f"  True Negatives:  {cm[0,0]:4} | False Positives: {cm[0,1]:4}")
    print(f"  False Negatives: {cm[1,0]:4} | True Positives:  {cm[1,1]:4}")
    
    accuracy = (cm[0,0] + cm[1,1]) / cm.sum()
    print(f"\n  Accuracy: {accuracy:.2%}")
    
    return model, X_train, X_test, y_test, test_pred

def analyze_model_insights(model, feature_cols, df, label_encoders):
    """Analyze what the model learned"""
    print("\n" + "="*60)
    print("MODEL INSIGHTS - WHAT IT DISCOVERED")
    print("="*60)
    
    # Feature importance
    importance = model.feature_importance(importance_type='gain')
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importance
    }).sort_values('importance', ascending=False)
    
    print("\nTop 20 Most Important Features:")
    print("-" * 50)
    for idx, row in importance_df.head(20).iterrows():
        # Clean feature name for display
        display_name = row['feature'].replace('_encoded', '').replace('_', ' ')
        print(f"  {display_name:35} {row['importance']:8.1f}")
    
    # Test scenarios to see learned patterns
    print("\nDiscovered Patterns (Testing Scenarios):")
    print("-" * 50)
    
    # Create test scenarios
    test_scenarios = [
        {
            'name': 'No PT, high pain',
            'pt_weeks_completed': 0,
            'pain_current': 9,
            'has_neurological_symptoms': False,
            'documentation_quality_score': 0.3,
            'payer': 'UnitedHealth'
        },
        {
            'name': '6 weeks PT, moderate pain',
            'pt_weeks_completed': 6,
            'pain_current': 6,
            'has_neurological_symptoms': False,
            'documentation_quality_score': 0.5,
            'payer': 'UnitedHealth'
        },
        {
            'name': '6 weeks PT + neuro symptoms',
            'pt_weeks_completed': 6,
            'pain_current': 7,
            'has_neurological_symptoms': True,
            'documentation_quality_score': 0.5,
            'payer': 'UnitedHealth'
        },
        {
            'name': 'Perfect documentation + treatment',
            'pt_weeks_completed': 8,
            'pain_current': 8,
            'has_neurological_symptoms': True,
            'documentation_quality_score': 1.0,
            'payer': 'UnitedHealth'
        },
        {
            'name': 'Same as above but BCBS',
            'pt_weeks_completed': 8,
            'pain_current': 8,
            'has_neurological_symptoms': True,
            'documentation_quality_score': 1.0,
            'payer': 'BCBS'
        }
    ]
    
    print("\nPredicted Approval Probabilities:")
    for scenario in test_scenarios:
        # Create a dummy case with all features
        dummy_case = pd.DataFrame([{col: 0 for col in feature_cols}])
        
        # Fill in scenario values (simplified - in production would be more complete)
        if 'pt_weeks_completed' in feature_cols:
            dummy_case['pt_weeks_completed'] = scenario['pt_weeks_completed']
        if 'pain_current' in feature_cols:
            dummy_case['pain_current'] = scenario['pain_current']
        if 'has_neurological_symptoms' in feature_cols:
            dummy_case['has_neurological_symptoms'] = int(scenario['has_neurological_symptoms'])
        if 'documentation_quality_score' in feature_cols:
            dummy_case['documentation_quality_score'] = scenario['documentation_quality_score']
        
        # Encode payer if available
        if 'payer_encoded' in feature_cols and 'payer' in label_encoders:
            try:
                dummy_case['payer_encoded'] = label_encoders['payer'].transform([scenario['payer']])[0]
            except:
                dummy_case['payer_encoded'] = 0
        
        # Predict
        prob = model.predict(dummy_case, num_iteration=model.best_iteration)[0]
        print(f"\n  {scenario['name']:35}")
        print(f"    -> {prob:.1%} approval probability")
    
    # Analyze PT weeks threshold
    print("\nPT Weeks Impact (discovered by model):")
    print("-" * 50)
    pt_probs = []
    for weeks in range(0, 13):
        dummy_case = pd.DataFrame([{col: 0 for col in feature_cols}])
        if 'pt_weeks_completed' in feature_cols:
            dummy_case['pt_weeks_completed'] = weeks
            dummy_case['pain_current'] = 7
            dummy_case['documentation_quality_score'] = 0.6
        prob = model.predict(dummy_case, num_iteration=model.best_iteration)[0]
        pt_probs.append(prob)
        bar = '#' * int(prob * 30)
        print(f"  {weeks:2} weeks: {bar:30} {prob:.1%}")
    
    # Find the threshold
    for i in range(1, len(pt_probs)):
        if pt_probs[i] - pt_probs[i-1] > 0.1:
            print(f"\n  Major jump at {i} weeks (+{(pt_probs[i]-pt_probs[i-1]):.1%})")
    
    return importance_df

def save_model_artifacts(model, label_encoders, feature_cols, importance_df):
    """Save all model artifacts"""
    os.makedirs('models', exist_ok=True)
    
    artifacts = {
        'model': model,
        'label_encoders': label_encoders,
        'feature_cols': feature_cols,
        'feature_importance': importance_df.to_dict()
    }
    
    joblib.dump(artifacts, 'models/advanced_approval_model.pkl')
    
    # Save feature importance separately
    importance_df.to_csv('models/feature_importance.csv', index=False)
    
    # Save model config
    config = {
        'model_type': 'lightgbm_advanced',
        'version': '2.0',
        'features': feature_cols,
        'n_features': len(feature_cols),
        'training_date': pd.Timestamp.now().isoformat()
    }
    
    with open('models/model_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\nModel artifacts saved to models/")

if __name__ == "__main__":
    # Load the new training data
    print("Loading training data...")
    df = pd.read_csv('training_data_v2.csv')
    
    print(f"Loaded {len(df)} cases with {len(df.columns)} raw features")
    
    # Prepare data
    df_prepared, feature_cols, label_encoders = prepare_model_data(df)
    
    # Train model
    model, X_train, X_test, y_test, test_pred = train_advanced_model(
        df_prepared, feature_cols
    )
    
    # Analyze insights
    importance_df = analyze_model_insights(
        model, feature_cols, df_prepared, label_encoders
    )
    
    # Save everything
    save_model_artifacts(model, label_encoders, feature_cols, importance_df)
    
    print("\n" + "="*60)
    print("ADVANCED MODEL TRAINING COMPLETE!")
    print("="*60)
    print("\nThe model discovered complex patterns from noisy, realistic data.")
    print("It can now make actionable recommendations for doctors!")
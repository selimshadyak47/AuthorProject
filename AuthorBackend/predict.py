import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime

def load_model():
    """Load the trained model and encoders"""
    artifacts = joblib.load('models/advanced_approval_model.pkl')
    return artifacts['model'], artifacts['label_encoders'], artifacts['feature_cols']

def create_sample_case():
    """Create a sample case for testing"""
    return {
        # Basic info
        'patient_age': 45,
        'patient_gender': 'F',
        'payer': 'UnitedHealth',
        'procedure_category': 'surgery',
        'procedure_code': '29827',
        'primary_diagnosis': 'M54.5',
        'diagnosis_months': 6,
        
        # Treatment history (key factor!)
        'treatment_history': 'physical_therapy_8w|prescription_nsaids_4w|steroid_injection_x1',
        
        # Pain progression
        'pain_initial': 8,
        'pain_current': 7,
        'pain_trend': 'stable',
        'pain_average': 7.2,
        'pain_max': 9,
        'pain_documented_consistently': True,
        
        # Clinical findings
        'has_neurological_symptoms': True,
        'imaging_findings': 'moderate',
        'functional_limitations': 'severe',
        'work_status': 'cannot_work',
        
        # Documentation quality
        'letter_word_count': 450,
        'uses_medical_necessity': True,
        'uses_failed_conservative': True,
        'uses_quality_of_life': True,
        'uses_activities_daily_living': True,
        'cites_medical_literature': False,
        'includes_objective_findings': True,
        'includes_imaging_results': True,
        'documentation_completeness': 0.85,
        
        # Previous attempts
        'previous_denials': 1,
        'appeals_attempted': 0,
        
        # Timing
        'days_since_symptom_onset': 180,
        'days_since_last_treatment': 14,
        'submission_day_of_week': 'Tuesday',
        'submission_time_of_day': 'morning',
        'quarter': 'Q2',
        'days_before_surgery': 30,
        
        # Provider
        'provider_specialty': 'orthopedic',
        'provider_npi': '1234567890'
    }

def engineer_features_for_prediction(case, label_encoders):
    """Apply the same feature engineering as training"""
    df = pd.DataFrame([case])
    
    # Extract treatment features
    treatment_types = [
        'physical_therapy', 'otc_nsaids', 'prescription_nsaids',
        'steroid_injection', 'chiropractic', 'massage',
        'acupuncture', 'nerve_block', 'radiofrequency'
    ]
    
    for treatment in treatment_types:
        df[f'tried_{treatment}'] = df['treatment_history'].str.contains(treatment).astype(int)
    
    # Extract PT weeks
    def get_pt_weeks(history):
        if 'physical_therapy' not in history:
            return 0
        try:
            pt_part = [t for t in history.split('|') if 'physical_therapy' in t][0]
            last_token = pt_part.rsplit('_', 1)[-1]
            return int(last_token.replace('w', '')) if last_token.endswith('w') else int(last_token)
        except:
            return 0
    
    df['pt_weeks_completed'] = df['treatment_history'].apply(get_pt_weeks)
    df['total_treatments_tried'] = df['treatment_history'].apply(
        lambda x: len(x.split('|')) if x != 'none' else 0
    )
    df['treatment_diversity'] = df['treatment_history'].apply(
        lambda x: len(set([t.split('_')[0] for t in x.split('|')])) if x != 'none' else 0
    )
    
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
    
    # Other engineered features
    df['is_chronic'] = (df['diagnosis_months'] >= 3).astype(int)
    df['complete_conservative'] = (
        (df['pt_weeks_completed'] >= 6) &
        (df['tried_prescription_nsaids'] == 1) &
        (df['total_treatments_tried'] >= 3)
    ).astype(int)
    
    work_impact_map = {
        'working_full': 0, 'light_duty': 1, 'cannot_work': 2,
        'retired': 0, 'unemployed': 0
    }
    df['work_impact_score'] = df['work_status'].map(work_impact_map)
    
    df['imaging_symptoms_match'] = (
        ((df['imaging_findings'] == 'severe') & (df['pain_current'] >= 8)) |
        ((df['imaging_findings'] == 'moderate') & (df['pain_current'] >= 6)) |
        ((df['imaging_findings'] == 'mild') & (df['pain_current'] >= 4))
    ).astype(int)
    
    df['red_flags'] = (
        df['has_neurological_symptoms'].astype(int) +
        (df['pain_trend'] == 'worsening').astype(int) +
        (df['functional_limitations'] == 'severe').astype(int)
    )
    
    df['is_friday'] = (df['submission_day_of_week'] == 'Friday').astype(int)
    df['is_q4'] = (df['quarter'] == 'Q4').astype(int)
    
    df['age_category'] = pd.cut(
        df['patient_age'],
        bins=[0, 40, 65, 100],
        labels=['young', 'middle', 'elderly']
    )
    
    # Interaction features
    df['pt_weeks_x_pain'] = df['pt_weeks_completed'] * df['pain_current']
    df['documentation_x_treatments'] = df['documentation_quality_score'] * df['total_treatments_tried']
    df['chronic_x_severe'] = df['is_chronic'] * (df['pain_current'] >= 7).astype(int)
    
    # Encode categorical variables
    categorical_columns = [
        'payer', 'procedure_category', 'procedure_code',
        'primary_diagnosis', 'pain_severity', 'pain_trend',
        'imaging_findings', 'functional_limitations',
        'work_status', 'provider_specialty', 'age_category',
        'submission_day_of_week', 'quarter'
    ]
    
    for col in categorical_columns:
        if col in df.columns and col in label_encoders:
            try:
                df[f'{col}_encoded'] = label_encoders[col].transform(df[col].astype(str))
            except:
                df[f'{col}_encoded'] = 0
    
    # Convert booleans to int
    boolean_features = [
        'pain_documented_consistently', 'has_neurological_symptoms',
        'uses_medical_necessity', 'uses_failed_conservative',
        'uses_quality_of_life', 'uses_activities_daily_living',
        'cites_medical_literature', 'includes_objective_findings',
        'includes_imaging_results'
    ]
    
    for col in boolean_features:
        if col in df.columns:
            df[col] = df[col].astype(int)
    
    return df

def predict_approval_probability(case):
    """Predict approval probability for a case"""
    model, label_encoders, feature_cols = load_model()
    
    # Engineer features
    df_engineered = engineer_features_for_prediction(case, label_encoders)
    
    # Select features in correct order
    X = df_engineered[feature_cols]
    
    # Predict
    probability = model.predict(X, num_iteration=model.best_iteration)[0]
    
    return probability

def main():
    print("="*60)
    print("MEDICAL APPROVAL PREDICTION SYSTEM")
    print("="*60)
    
    # Create sample case
    case = create_sample_case()
    
    print("\nSample Case:")
    print(f"  Patient: {case['patient_age']}yo {case['patient_gender']}")
    print(f"  Payer: {case['payer']}")
    print(f"  Procedure: {case['procedure_category']} ({case['procedure_code']})")
    print(f"  Treatment History: {case['treatment_history']}")
    print(f"  Pain: {case['pain_current']}/10 ({case['pain_trend']})")
    print(f"  Work Status: {case['work_status']}")
    print(f"  Neurological Symptoms: {case['has_neurological_symptoms']}")
    print(f"  Documentation Quality: {case['documentation_completeness']:.1%}")
    
    # Predict
    probability = predict_approval_probability(case)
    
    print(f"\nPrediction:")
    print(f"  Approval Probability: {probability:.1%}")
    print(f"  Recommendation: {'APPROVE' if probability >= 0.5 else 'DENY'}")
    
    # Show what drives the decision
    print(f"\nKey Factors:")
    print(f"  - Physical Therapy: {case['treatment_history'].split('|')[0]}")
    print(f"  - Pain Level: {case['pain_current']}/10")
    print(f"  - Documentation: {case['documentation_completeness']:.1%}")
    print(f"  - Payer: {case['payer']}")
    
    print("\n" + "="*60)
    print("The model is ready for production use!")
    print("="*60)

if __name__ == "__main__":
    main()


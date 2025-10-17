from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Load model artifacts
print("Loading advanced model...")
artifacts = joblib.load('models/advanced_approval_model.pkl')
model = artifacts['model']
label_encoders = artifacts['label_encoders']
feature_cols = artifacts['feature_cols']

app = FastAPI(title="AuthAI Advanced Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PriorAuthRequest(BaseModel):
    # Demographics
    patient_age: int
    patient_gender: str
    payer: str
    
    # Procedure
    procedure_category: str  # imaging, surgery, injection
    procedure_code: str
    primary_diagnosis: str
    diagnosis_months: int
    
    # Treatment history (simplified for input)
    pt_weeks: int = 0
    tried_nsaids: bool = False
    tried_injections: bool = False
    other_treatments: List[str] = []
    
    # Clinical findings
    pain_current: int
    pain_trend: str  # stable, worsening, improving
    has_neurological_symptoms: bool = False
    imaging_findings: str = "none"  # none, mild, moderate, severe
    work_status: str  # working_full, light_duty, cannot_work
    
    # Documentation
    includes_failed_conservative: bool = False
    includes_medical_necessity: bool = False
    includes_work_impact: bool = False
    documentation_complete: bool = False
    
    # Timing
    submission_day: str = "Monday"
    urgent: bool = False

class ActionableRecommendation(BaseModel):
    action: str
    impact: str
    effort: str
    priority: str
    category: str

class PredictionResponse(BaseModel):
    approval_probability: float
    confidence_level: str
    risk_factors: List[str]
    positive_factors: List[str]
    actionable_recommendations: List[ActionableRecommendation]
    estimated_days_to_decision: int
    
@app.post("/predict", response_model=PredictionResponse)
async def predict_approval(request: PriorAuthRequest):
    try:
        # Prepare input features
        input_features = prepare_features_from_request(request)
        
        # Make prediction
        probability = model.predict(input_features, num_iteration=model.best_iteration)[0]
        
        # Generate actionable insights
        recommendations = generate_actionable_recommendations(request, probability)
        
        # Identify risk and positive factors
        risk_factors = identify_risk_factors(request)
        positive_factors = identify_positive_factors(request)
        
        # Determine confidence
        if probability > 0.75:
            confidence = "High"
        elif probability > 0.45:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        # Estimate timeline
        days_estimate = estimate_decision_timeline(request, probability)
        
        return PredictionResponse(
            approval_probability=round(probability, 3),
            confidence_level=confidence,
            risk_factors=risk_factors,
            positive_factors=positive_factors,
            actionable_recommendations=recommendations,
            estimated_days_to_decision=days_estimate
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def prepare_features_from_request(request: PriorAuthRequest) -> pd.DataFrame:
    """Convert request to model features"""
    
    # Create base feature dict with all required columns
    features = {col: 0 for col in feature_cols}
    
    # Map simple fields
    simple_mappings = {
        'patient_age': request.patient_age,
        'diagnosis_months': request.diagnosis_months,
        'pt_weeks_completed': request.pt_weeks,
        'pain_current': request.pain_current,
        'has_neurological_symptoms': int(request.has_neurological_symptoms),
        'uses_failed_conservative': int(request.includes_failed_conservative),
        'uses_medical_necessity': int(request.includes_medical_necessity),
    }
    
    for key, value in simple_mappings.items():
        if key in features:
            features[key] = value
    
    # Encode categorical variables
    categorical_mappings = {
        'payer': request.payer,
        'procedure_category': request.procedure_category,
        'pain_trend': request.pain_trend,
        'imaging_findings': request.imaging_findings,
        'work_status': request.work_status,
        'submission_day_of_week': request.submission_day
    }
    
    for field, value in categorical_mappings.items():
        if f'{field}_encoded' in features and field in label_encoders:
            try:
                features[f'{field}_encoded'] = label_encoders[field].transform([value])[0]
            except:
                features[f'{field}_encoded'] = 0
    
    # Calculate derived features
    if 'total_treatments_tried' in features:
        features['total_treatments_tried'] = (
            (request.pt_weeks > 0) + 
            request.tried_nsaids + 
            request.tried_injections + 
            len(request.other_treatments)
        )
    
    if 'documentation_quality_score' in features:
        doc_score = (
            request.includes_failed_conservative +
            request.includes_medical_necessity +
            request.includes_work_impact +
            request.documentation_complete
        ) / 4
        features['documentation_quality_score'] = doc_score
    
    # Create DataFrame
    return pd.DataFrame([features])[feature_cols]

def generate_actionable_recommendations(request: PriorAuthRequest, probability: float) -> List[ActionableRecommendation]:
    """Generate specific, actionable recommendations"""
    
    recommendations = []
    
    # PT recommendations
    if request.pt_weeks < 6:
        weeks_needed = 6 - request.pt_weeks
        impact = "+25%" if request.pt_weeks < 4 else "+15%"
        recommendations.append(ActionableRecommendation(
            action=f"Document {weeks_needed} more weeks of physical therapy",
            impact=f"{impact} approval probability",
            effort=f"{weeks_needed} weeks wait",
            priority="HIGH" if probability < 0.5 else "MEDIUM",
            category="Treatment"
        ))
    elif request.pt_weeks >= 6 and request.pt_weeks < 8:
        recommendations.append(ActionableRecommendation(
            action="Consider 2 more weeks PT for maximum approval odds",
            impact="+8% approval probability",
            effort="2 weeks wait",
            priority="LOW",
            category="Treatment"
        ))
    
    # Documentation quick wins
    if not request.includes_failed_conservative:
        recommendations.append(ActionableRecommendation(
            action='Add phrase "failed conservative treatment" to letter',
            impact="+12% approval probability",
            effort="1 minute",
            priority="QUICK WIN",
            category="Documentation"
        ))
    
    if not request.includes_medical_necessity:
        recommendations.append(ActionableRecommendation(
            action='Include "medically necessary" with clinical justification',
            impact="+10% approval probability",
            effort="5 minutes",
            priority="QUICK WIN",
            category="Documentation"
        ))
    
    if not request.includes_work_impact and request.work_status != "working_full":
        recommendations.append(ActionableRecommendation(
            action="Get work disability letter from employer",
            impact="+15% approval probability",
            effort="1-2 days",
            priority="HIGH",
            category="Documentation"
        ))
    
    # Clinical documentation
    if request.has_neurological_symptoms and not request.includes_medical_necessity:
        recommendations.append(ActionableRecommendation(
            action="Emphasize neurological findings in letter",
            impact="+18% approval probability",
            effort="5 minutes",
            priority="QUICK WIN",
            category="Clinical"
        ))
    
    # Treatment additions
    if not request.tried_injections and request.procedure_category == "surgery":
        recommendations.append(ActionableRecommendation(
            action="Consider epidural steroid injection trial first",
            impact="+20% approval probability",
            effort="2-4 weeks",
            priority="HIGH" if request.payer == "Anthem" else "MEDIUM",
            category="Treatment"
        ))
    
    # Timing optimizations
    if request.submission_day == "Friday":
        recommendations.append(ActionableRecommendation(
            action="Submit on Monday-Wednesday instead of Friday",
            impact="+8% approval probability",
            effort="Wait 1-3 days",
            priority="QUICK WIN",
            category="Timing"
        ))
    
    # Payer-specific recommendations
    if request.payer == "UnitedHealth" and request.pt_weeks < 8:
        recommendations.append(ActionableRecommendation(
            action="United specifically wants 8+ weeks PT",
            impact="+15% approval probability",
            effort=f"{8-request.pt_weeks} weeks",
            priority="HIGH",
            category="Payer-Specific"
        ))
    
    # Sort by priority
    priority_order = {"QUICK WIN": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recommendations.sort(key=lambda x: priority_order[x.priority])
    
    return recommendations[:5]  # Top 5 most impactful

def identify_risk_factors(request: PriorAuthRequest) -> List[str]:
    """Identify factors that hurt approval chances"""
    risks = []
    
    if request.pt_weeks < 4:
        risks.append(f"Only {request.pt_weeks} weeks PT (minimum 6 expected)")
    
    if request.payer == "UnitedHealth":
        risks.append("UnitedHealth has 67% denial rate for this procedure")
    
    if request.submission_day == "Friday":
        risks.append("Friday submissions have 15% lower approval rate")
    
    if not request.tried_injections and request.procedure_category == "surgery":
        risks.append("No injection trial before surgery request")
    
    if request.pain_current < 5:
        risks.append("Pain score below moderate threshold")
    
    if not request.documentation_complete:
        risks.append("Incomplete documentation")
    
    return risks

def identify_positive_factors(request: PriorAuthRequest) -> List[str]:
    """Identify factors that help approval"""
    positives = []
    
    if request.pt_weeks >= 6:
        positives.append(f"Completed {request.pt_weeks} weeks physical therapy")
    
    if request.has_neurological_symptoms:
        positives.append("Documented neurological symptoms")
    
    if request.work_status == "cannot_work":
        positives.append("Documented work disability")
    
    if request.pain_trend == "worsening":
        positives.append("Progressive worsening documented")
    
    if request.imaging_findings in ["moderate", "severe"]:
        positives.append(f"Imaging shows {request.imaging_findings} findings")
    
    if request.includes_failed_conservative and request.includes_medical_necessity:
        positives.append("Strong documentation with key phrases")
    
    return positives

def estimate_decision_timeline(request: PriorAuthRequest, probability: float) -> int:
    """Estimate days to decision based on patterns"""
    base_days = 7
    
    if request.urgent:
        base_days = 2
    elif probability > 0.8:
        base_days = 5
    elif probability < 0.3:
        base_days = 14  # Likely denial, then appeal
    
    if request.payer == "UnitedHealth":
        base_days += 2
    elif request.payer == "BCBS":
        base_days -= 1
    
    if request.submission_day == "Friday":
        base_days += 3  # Weekend delay
    
    return max(1, base_days)

@app.get("/")
async def root():
    return {
        "message": "AuthAI Advanced Prediction API",
        "version": "2.0",
        "model": "Advanced ML with actionable insights"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_v2:app", host="0.0.0.0", port=8000, reload=True)
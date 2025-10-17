import pandas as pd
import numpy as np
import random
import argparse

np.random.seed(42)
random.seed(42)


def generate_treatment_history():
    """Generate realistic previous treatment attempts"""
    treatments = []

    treatment_options = [
        {'name': 'rest', 'weeks': random.randint(1, 4)},
        {'name': 'ice_heat', 'weeks': random.randint(1, 3)},
        {'name': 'otc_nsaids', 'weeks': random.randint(2, 8)},
        {'name': 'prescription_nsaids', 'weeks': random.randint(2, 6)},
        {'name': 'physical_therapy', 'weeks': random.randint(0, 16)},
        {'name': 'chiropractic', 'weeks': random.randint(0, 12)},
        {'name': 'massage', 'weeks': random.randint(0, 8)},
        {'name': 'acupuncture', 'weeks': random.randint(0, 6)},
        {'name': 'steroid_injection', 'count': random.randint(0, 3)},
        {'name': 'nerve_block', 'count': random.randint(0, 2)},
        {'name': 'radiofrequency_ablation', 'count': random.randint(0, 1)}
    ]

    num_treatments = random.choices([2, 3, 4, 5, 6, 7],
                                    weights=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05])[0]

    selected = random.sample(treatment_options, min(num_treatments, len(treatment_options)))

    for treatment in selected:
        if 'weeks' in treatment:
            if treatment['weeks'] > 0:
                treatments.append(f"{treatment['name']}_{treatment['weeks']}w")
        elif 'count' in treatment:
            if treatment['count'] > 0:
                treatments.append(f"{treatment['name']}_x{treatment['count']}")

    return '|'.join(treatments) if treatments else 'none'


def generate_pain_progression():
    """Generate realistic pain score progression over time"""
    initial = random.choices([5, 6, 7, 8, 9], weights=[0.1, 0.2, 0.3, 0.3, 0.1])[0]

    patterns = ['stable', 'worsening', 'improving', 'variable']
    pattern = random.choices(patterns, weights=[0.4, 0.3, 0.1, 0.2])[0]

    scores = [initial]
    for _ in range(3):
        if pattern == 'stable':
            scores.append(scores[-1] + random.randint(-1, 1))
        elif pattern == 'worsening':
            scores.append(min(10, scores[-1] + random.randint(0, 2)))
        elif pattern == 'improving':
            scores.append(max(3, scores[-1] - random.randint(0, 2)))
        else:
            scores.append(random.randint(4, 9))

    scores = [max(3, min(10, s)) for s in scores]

    return {
        'pain_initial': scores[0],
        'pain_current': scores[-1],
        'pain_trend': pattern,
        'pain_average': float(np.mean(scores)),
        'pain_max': max(scores),
        'pain_documented_consistently': bool(np.random.choice([True, False], p=[0.7, 0.3]))
    }


def generate_documentation_quality():
    """Generate features about documentation quality"""
    return {
        'letter_word_count': random.randint(150, 800),
        'uses_medical_necessity': bool(np.random.choice([True, False], p=[0.6, 0.4])),
        'uses_failed_conservative': bool(np.random.choice([True, False], p=[0.5, 0.5])),
        'uses_quality_of_life': bool(np.random.choice([True, False], p=[0.4, 0.6])),
        'uses_activities_daily_living': bool(np.random.choice([True, False], p=[0.45, 0.55])),
        'cites_medical_literature': bool(np.random.choice([True, False], p=[0.3, 0.7])),
        'includes_objective_findings': bool(np.random.choice([True, False], p=[0.65, 0.35])),
        'includes_imaging_results': bool(np.random.choice([True, False], p=[0.7, 0.3])),
        'documentation_completeness': random.uniform(0.3, 1.0)
    }


def generate_timing_factors():
    """Generate timing-related features"""
    return {
        'days_since_symptom_onset': random.randint(14, 365),
        'days_since_last_treatment': random.randint(0, 60),
        'submission_day_of_week': random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        'submission_time_of_day': random.choice(['morning', 'afternoon', 'evening']),
        'quarter': random.choice(['Q1', 'Q2', 'Q3', 'Q4']),
        'days_before_surgery': random.randint(7, 90) if random.random() > 0.5 else None
    }


def calculate_approval_with_uncertainty(case):
    base_prob = 0.30 + random.uniform(-0.05, 0.05)

    treatments = case['treatment_history'].split('|') if case['treatment_history'] != 'none' else []

    pt_treatments = [t for t in treatments if 'physical_therapy' in t]
    if pt_treatments:
        # treatment token looks like "physical_therapy_8w"; split from the right
        last_token = pt_treatments[0].rsplit('_', 1)[-1]
        pt_weeks = int(last_token.replace('w', '')) if last_token.endswith('w') else int(last_token)
        if pt_weeks >= 8:
            base_prob += 0.30 + random.uniform(-0.05, 0.05)
        elif pt_weeks >= 6:
            base_prob += 0.20 + random.uniform(-0.05, 0.05)
        elif pt_weeks >= 4:
            base_prob += 0.10 + random.uniform(-0.03, 0.03)

    treatment_types = len(set([t.split('_')[0] for t in treatments]))
    if treatment_types >= 4:
        base_prob += 0.15 + random.uniform(-0.03, 0.03)
    elif treatment_types >= 3:
        base_prob += 0.08 + random.uniform(-0.02, 0.02)

    if case['pain_trend'] == 'worsening':
        base_prob += 0.12 + random.uniform(-0.03, 0.03)
    elif case['pain_trend'] == 'stable' and case['pain_current'] >= 7:
        base_prob += 0.08 + random.uniform(-0.02, 0.02)

    if case['pain_documented_consistently']:
        base_prob += 0.05 + random.uniform(-0.02, 0.02)

    if case['uses_medical_necessity']:
        base_prob += 0.10 + random.uniform(-0.03, 0.03)
    if case['uses_failed_conservative']:
        base_prob += 0.12 + random.uniform(-0.03, 0.03)
    if case['uses_quality_of_life']:
        base_prob += 0.05 + random.uniform(-0.02, 0.02)
    if case['documentation_completeness'] > 0.8:
        base_prob += 0.08 + random.uniform(-0.02, 0.02)

    if case['work_status'] in ['cannot_work', 'light_duty']:
        base_prob += 0.15 + random.uniform(-0.04, 0.04)

    if case['has_neurological_symptoms']:
        base_prob += 0.18 + random.uniform(-0.04, 0.04)

    if case['imaging_findings'] in ['moderate', 'severe']:
        base_prob += 0.10 + random.uniform(-0.03, 0.03)

    injection_treatments = [t for t in treatments if 'injection' in t or 'block' in t]
    if injection_treatments:
        base_prob += 0.08 + random.uniform(-0.03, 0.03)

    payer_adjustments = {
        'UnitedHealth': -0.15 + random.uniform(-0.05, 0.05),
        'Anthem': -0.08 + random.uniform(-0.03, 0.03),
        'Aetna': 0.0 + random.uniform(-0.02, 0.02),
        'BCBS': 0.05 + random.uniform(-0.03, 0.03),
        'Cigna': -0.10 + random.uniform(-0.04, 0.04),
        'Humana': 0.02 + random.uniform(-0.02, 0.02)
    }
    base_prob += payer_adjustments.get(case['payer'], 0)

    if case['submission_day_of_week'] == 'Friday':
        base_prob -= 0.08 + random.uniform(-0.02, 0.02)
    if case['quarter'] == 'Q4':
        base_prob -= 0.05 + random.uniform(-0.02, 0.02)

    if case['payer'] == 'UnitedHealth':
        if 'physical_therapy' not in case['treatment_history']:
            base_prob -= 0.20 + random.uniform(-0.05, 0.05)

    if case['payer'] == 'Anthem':
        if not injection_treatments and case['procedure_category'] == 'surgery':
            base_prob -= 0.15 + random.uniform(-0.04, 0.04)

    if case['patient_age'] < 40:
        base_prob -= 0.05 + random.uniform(-0.02, 0.02)
    elif case['patient_age'] > 70:
        base_prob -= 0.03 + random.uniform(-0.02, 0.02)

    base_prob += random.uniform(-0.10, 0.10)

    final_prob = max(0.0, min(1.0, base_prob))
    approved = 1 if random.random() < final_prob else 0

    denial_reason = None
    if approved == 0:
        reasons = [
            'insufficient_conservative_treatment',
            'documentation_incomplete',
            'not_medically_necessary',
            'requires_peer_review',
            'wrong_procedure_code',
            'out_of_network'
        ]
        weights = [0.3, 0.2, 0.2, 0.15, 0.1, 0.05]
        if 'physical_therapy' not in case['treatment_history']:
            weights[0] = 0.5
        if case['documentation_completeness'] < 0.5:
            weights[1] = 0.4

        denial_reason = random.choices(reasons, weights=weights)[0]

    return approved, denial_reason, final_prob


def generate_realistic_case(case_id):
    case = {
        'case_id': f'CASE_{case_id:05d}',
        'patient_age': random.randint(25, 85),
        'patient_gender': random.choice(['M', 'F']),
        'payer': random.choices(
            ['UnitedHealth', 'Anthem', 'Aetna', 'BCBS', 'Cigna', 'Humana'],
            weights=[0.25, 0.20, 0.15, 0.20, 0.15, 0.05]
        )[0]
    }

    procedures = {
        'imaging': ['72148', '72158', '73721', '70553'],
        'surgery': ['29827', '64721', '63047', '22612'],
        'injection': ['64483', '62323', '20610']
    }
    case['procedure_category'] = random.choices(
        ['imaging', 'surgery', 'injection'],
        weights=[0.4, 0.4, 0.2]
    )[0]
    case['procedure_code'] = random.choice(procedures[case['procedure_category']])

    case['primary_diagnosis'] = random.choice([
        'M54.5', 'M51.26', 'M79.3', 'M25.561', 'G56.00',
        'M17.11', 'M75.121', 'S83.512A'
    ])
    case['diagnosis_months'] = random.randint(1, 36)

    case['treatment_history'] = generate_treatment_history()

    pain_data = generate_pain_progression()
    case.update(pain_data)

    doc_quality = generate_documentation_quality()
    case.update(doc_quality)

    case['has_neurological_symptoms'] = bool(np.random.choice([True, False], p=[0.35, 0.65]))
    case['imaging_findings'] = random.choices(
        ['normal', 'mild', 'moderate', 'severe'],
        weights=[0.1, 0.3, 0.4, 0.2]
    )[0]
    case['functional_limitations'] = random.choices(
        ['none', 'mild', 'moderate', 'severe'],
        weights=[0.05, 0.25, 0.45, 0.25]
    )[0]
    case['work_status'] = random.choices(
        ['working_full', 'light_duty', 'cannot_work', 'retired', 'unemployed'],
        weights=[0.3, 0.2, 0.25, 0.15, 0.1]
    )[0]

    case['previous_denials'] = random.choices([0, 1, 2, 3], weights=[0.6, 0.25, 0.10, 0.05])[0]
    case['appeals_attempted'] = min(case['previous_denials'], random.choices([0, 1, 2], weights=[0.7, 0.25, 0.05])[0])

    timing = generate_timing_factors()
    case.update(timing)

    case['provider_specialty'] = random.choices(
        ['orthopedic', 'pain_management', 'neurology', 'primary_care', 'neurosurgery'],
        weights=[0.3, 0.25, 0.15, 0.20, 0.1]
    )[0]
    case['provider_npi'] = f"1{random.randint(100000000, 999999999)}"

    approved, denial_reason, true_probability = calculate_approval_with_uncertainty(case)

    case['approved'] = approved
    case['denial_reason'] = denial_reason if denial_reason else 'none'

    return case


def generate_dataset(n=5000):
    cases = []
    print(f"Generating {n} realistic cases with uncertainty...")
    for i in range(n):
        if i % 500 == 0:
            print(f"  Generated {i}/{n} cases...")
        cases.append(generate_realistic_case(i))
    return pd.DataFrame(cases)


def analyze_dataset(df):
    print("\n" + "="*60)
    print("DATASET ANALYSIS")
    print("="*60)

    print(f"\nBasic Statistics:")
    print(f"  Total cases: {len(df)}")
    print(f"  Approval rate: {df['approved'].mean():.2%}")
    print(f"  Features: {len(df.columns)} columns")

    print(f"\nApproval by Payer:")
    payer_stats = df.groupby('payer')['approved'].agg(['mean', 'count']).sort_values('mean')
    for payer, row in payer_stats.iterrows():
        print(f"  {payer:15} {row['mean']:6.2%} ({int(row['count'])} cases)")

    print(f"\nApproval by Procedure Category:")
    proc_stats = df.groupby('procedure_category')['approved'].mean().sort_values()
    for proc, rate in proc_stats.items():
        print(f"  {proc:15} {rate:6.2%}")

    print(f"\nTop Denial Reasons:")
    denial_counts = df[df['denial_reason'] != 'none']['denial_reason'].value_counts()
    for reason, count in denial_counts.head(5).items():
        print(f"  {reason:35} {count:4} ({count/len(df)*100:.1f}%)")

    print(f"\nTreatment History Complexity:")
    df['treatment_count'] = df['treatment_history'].apply(
        lambda x: len(x.split('|')) if x != 'none' else 0
    )
    print(f"  Average treatments tried: {df['treatment_count'].mean():.1f}")
    print(f"  Max treatments tried: {df['treatment_count'].max()}")

    print(f"\nDocumentation Quality:")
    print(f"  Uses 'medical necessity': {df['uses_medical_necessity'].mean():.1%}")
    print(f"  Uses 'failed conservative': {df['uses_failed_conservative'].mean():.1%}")
    print(f"  Average completeness: {df['documentation_completeness'].mean():.2f}")

    print(f"\nTiming Patterns:")
    day_stats = df.groupby('submission_day_of_week')['approved'].mean().sort_values()
    print(f"  Worst day: {day_stats.index[0]} ({day_stats.iloc[0]:.1%})")
    print(f"  Best day: {day_stats.index[-1]} ({day_stats.iloc[-1]:.1%})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=5000, help='Number of cases to generate')
    parser.add_argument('--out', type=str, default='training_data_v2.csv', help='Output CSV path')
    args = parser.parse_args()

    df = generate_dataset(args.n)
    df.to_csv(args.out, index=False)
    analyze_dataset(df)
    print("\n" + "="*60)
    print(f"Dataset generated and saved to '{args.out}'")
    print("The ML model must discover patterns from this complex, noisy data!")
    print("="*60)


if __name__ == "__main__":
    main()
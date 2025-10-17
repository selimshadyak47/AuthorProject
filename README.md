 AuthOr — AI-Powered Prior Authorization Assistant

 Team Members
- Selim Selim  
- Thiago Barata  



Project Title
AuthOr — The AI Doctor’s Assistant for Insurance Approvals



Summary: Problem & Solution

Problem:
Doctors spend **over 20 hours a week** on administrative tasks like writing prior authorization requests, appeal letters, and dealing with denials. Each request can take up to **45 minutes** to complete, requiring perfect documentation that varies by insurer and procedure. This inefficiency leads to **physician burnout** and **delayed patient care**

Solution:  
AuthOr automates the prior-authorization process with AI. Doctors input basic patient details and clinical history — AuthOr instantly:
- Predicts approval probability based on historical data and payer rules  
- Flags missing documentation required for approval  
- Generates a fully compliant, insurer-ready prior-authorization letter or appeal in seconds  

By cutting administrative time from 45 minutes to 30 seconds, Author restores time for patient care and drastically reduces denial rates.

---

How AI is Used

AuthOr uses three integrated machine learning models:

Approval Predictor (LightGBM)
- Input: payer, plan, CPT/ICD-10 codes, treatment history (PT weeks, NSAID weeks, injections, etc.), and impairment data.  
- Output: approval probability and top contributing features.  
- Purpose: Gives doctors immediate insight into their likelihood of approval and what’s missing.

Policy Checklist Extractor (RAG + LLM)
- Input: insurer policy documents (PDFs, web pages).  
- Output: JSON checklist of required documentation (e.g., “≥6 weeks PT”, “objective neurological signs”).  
- Purpose: Auto-identifies payer-specific requirements for each procedure and cross-references the doctor’s inputs.

Letter Generator (LLM + Validator)
- Input: structured patient data + extracted checklist.  
- Output: optimized prior-authorization letter or appeal, validated against missing policy criteria.  
- Purpose: Generates insurance-ready, medically accurate documentation in professional clinical language.

Each submission improves model accuracy via continuous retraining on approval and denial outcomes.

---

Repository Overview
The repository includes all code and assets for a production-ready implementation of AuthOr:
- train_predictor.py` — trains the approval probability model  
- build_policy_index.py` — creates vector embeddings for payer policies  
- extract_policy_criteria.py` — extracts documentation checklists  
- generate_letter.py` — LLM-based generation and validation pipeline  
- app.py` — FastAPI backend integrating all models  
- /frontend` — Next.js interface for doctors  
- /models` — serialized model weights  
- /data` — synthetic and anonymized test cases  

---

### 🏁 **Summary**
AuthOr uses AI to eliminate repetitive healthcare bureaucracy. By combining real-world clinical data, policy retrieval, and natural-language generation, AuthOr allows physicians to spend less time fighting insurance and more time caring for patients.

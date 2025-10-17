import { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Copy, Download, Sparkles, Send, Plus, X, Upload, FileText, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { validateCPTCode, validateICD10Code, validateAge, validatePainScale } from "../../lib/api";
import { claudeService, FormData as ClaudeFormData, GeneratedLetter } from "../../lib/claude";

export function NewPriorAuth() {
  const [generated, setGenerated] = useState(false);
  const [painScale, setPainScale] = useState([7]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [backendScore, setBackendScore] = useState<number | null>(null);
  const [backendConfidence, setBackendConfidence] = useState<string | null>(null);
  const [backendRiskFactors, setBackendRiskFactors] = useState<string[]>([]);
  const [backendPositiveFactors, setBackendPositiveFactors] = useState<string[]>([]);
  const [backendRecommendations, setBackendRecommendations] = useState<any[]>([]);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // File upload states
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileProcessingError, setFileProcessingError] = useState<string | null>(null);
  
  // Claude AI states
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<GeneratedLetter | null>(null);
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const letterRef = useRef<HTMLDivElement | null>(null);
  
  const [formData, setFormData] = useState({
    // Patient & Insurance
    patientName: "",
    dob: "",
    insurance: "",
    memberId: "",
    groupNumber: "",
    providerName: "Dr. Smith",
    npi: "1234567890",
    
    // Diagnosis & Procedure
    icd10: "",
    cpt: "",
    procedure: "",
    anatomicalLocation: "",
    symptomDuration: "",
    symptomDurationUnit: "weeks",
    
    // Treatment History
    ptWeeks: "",
    medicationName: "",
    medicationDuration: "",
    injectionCount: "",
    injectionType: "",
    imagingType: "",
    imagingDate: "",
    imagingResult: "",
    
    // Clinical Evidence
    functionalImpairment: "",
    workStatus: "",
    objectiveFindings: "",
  });

  // Pure local calculation - no API calls
  useEffect(() => {
    const local = calculateApprovalRate();
    setBackendScore(local);
    const recs = buildLocalRecommendations();
    setBackendRecommendations(recs);
    setBackendConfidence(null);
    setBackendRiskFactors([]);
    setBackendPositiveFactors([]);
    setIsLoading(false);
    setApiError(null);
  }, [formData, painScale]);

  // Validation functions
  const validateField = (fieldName: string, value: any) => {
    let error = "";
    
    switch (fieldName) {
      case "cpt":
        const cptValidation = validateCPTCode(value);
        if (!cptValidation.isValid) {
          error = cptValidation.error || "Invalid CPT code";
        }
        break;
      case "icd10":
        const icd10Validation = validateICD10Code(value);
        if (!icd10Validation.isValid) {
          error = icd10Validation.error || "Invalid ICD-10 code";
        }
        break;
      case "dob":
        if (value) {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          const ageValidation = validateAge(age);
          if (!ageValidation.isValid) {
            error = ageValidation.error || "Invalid age";
          }
        }
        break;
      case "painScale":
        const painValidation = validatePainScale(painScale[0]);
        if (!painValidation.isValid) {
          error = painValidation.error || "Invalid pain scale";
        }
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    return error === "";
  };

  const handleGenerate = () => {
    setGenerated(true);
  };

  const validateAllFields = () => {
    const errors: string[] = [];
    
    // Check required fields
    if (!formData.patientName) errors.push("Patient Name");
    if (!formData.dob) errors.push("Date of Birth");
    if (!formData.insurance) errors.push("Insurance Provider");
    if (!formData.memberId) errors.push("Member ID");
    if (!formData.npi) errors.push("NPI Number");
    if (!formData.icd10) errors.push("ICD-10 Code");
    if (!formData.cpt) errors.push("CPT Code");
    if (!formData.procedure) errors.push("Procedure");
    if (!formData.anatomicalLocation) errors.push("Anatomical Location");
    if (!formData.symptomDuration) errors.push("Symptom Duration");
    if (!formData.ptWeeks) errors.push("Physical Therapy Duration");
    if (!formData.medicationName) errors.push("Medication Trial");
    if (!formData.functionalImpairment) errors.push("Functional Impairment");
    if (!formData.workStatus) errors.push("Work Status");
    if (!formData.objectiveFindings) errors.push("Objective Findings");
    
    // Check validation errors for format issues
    Object.entries(validationErrors).forEach(([field, error]) => {
      if (error) {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        errors.push(`${fieldName}: ${error}`);
      }
    });
    
    return errors;
  };

  const handleGenerateLetter = async () => {
    const validationErrors = validateAllFields();
    if (validationErrors.length > 0) {
      setShowValidationPopup(true);
      return;
    }
    
    setIsGeneratingLetter(true);
    setClaudeError(null);
    
    try {
      // Transform form data to Claude format
      const claudeFormData: ClaudeFormData = {
        patientName: formData.patientName,
        dob: formData.dob,
        insurance: formData.insurance,
        memberId: formData.memberId,
        npi: formData.npi,
        icd10: formData.icd10,
        cpt: formData.cpt,
        procedure: formData.procedure,
        anatomicalLocation: formData.anatomicalLocation,
        symptomDuration: formData.symptomDuration,
        symptomDurationUnit: formData.symptomDurationUnit,
        ptWeeks: formData.ptWeeks,
        medicationName: formData.medicationName,
        medicationDuration: formData.medicationDuration,
        injectionCount: formData.injectionCount,
        injectionType: formData.injectionType,
        imagingType: formData.imagingType,
        imagingDate: formData.imagingDate,
        imagingResult: formData.imagingResult,
        functionalImpairment: formData.functionalImpairment,
        workStatus: formData.workStatus,
        objectiveFindings: formData.objectiveFindings,
        painScale: painScale[0]
      };

      // Generate letter with context
      const letter = await claudeService.generateAuthorizationLetter(claudeFormData);
      
      setGeneratedLetter(letter);
      setGenerated(true);
    } catch (error: any) {
      console.error('Claude Error:', error);
      setClaudeError(error.message || 'Failed to generate letter');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handlePrintLetter = () => {
    try {
      let content = generatedLetter?.content || '';
      
      // Remove JSON from the end of the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = content.replace(jsonMatch[0], '').trim();
      }
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;
      
      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
        <html>
        <head>
          <title>Authorization Letter</title>
          <meta charset="utf-8" />
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              padding: 40px; 
              line-height: 1.6; 
              color: #000; 
              max-width: 800px; 
              margin: 0 auto;
            }
            .letter { 
              white-space: pre-wrap; 
              font-size: 12pt;
            }
            @media print {
              body { padding: 20px; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="letter">${content}</div>
        </body>
        </html>`);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (e) {
      console.error('Download error', e);
    }
  };

  // No manual context input; backend uses public/medical_context.txt implicitly

  // File processing functions
  const handleFileUpload = async (field: 'imagingResult' | 'objectiveFindings', files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      setFileProcessingError('Please upload a PDF or JPG file only.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setFileProcessingError('File size must be less than 10MB.');
      return;
    }
    
    setIsProcessingFile(true);
    setFileProcessingError(null);
    
    try {
      // Don't put any text in the form field, just mark as uploaded
      // The visual indicator will show "File uploaded" next to the button
      setFormData(prev => ({ ...prev, [field]: `[FILE_UPLOADED]` }));
    } catch (error) {
      console.error('File upload error:', error);
      setFileProcessingError('Failed to upload file. Please try again.');
    } finally {
      setIsProcessingFile(false);
    }
  };


  const calculateApprovalRate = () => {
    // EXTREMELY SIMPLE: start at 1, add/subtract small amounts per field presence
    let score = 1;

    // Required basics
    if (formData.patientName) score += 3; else score -= 2;
    if (formData.icd10) score += 5; else score -= 3;
    if (formData.cpt) score += 5; else score -= 3;

    // Insurance present
    if (formData.insurance) score += 2;

    // Duration & PT
    const ptWeeksNum = parseInt(String(formData.ptWeeks || '0'), 10) || 0;
    if (formData.symptomDuration) score += 3; else score -= 2;
    if (ptWeeksNum >= 6) score += 8; else if (ptWeeksNum >= 3) score += 4; else score -= 4;

    // Meds & injections
    if (formData.medicationName) score += 5; else score -= 3;
    if (formData.injectionType || formData.injectionCount) score += 2;

    // Imaging & findings
    const hasImagingResults = formData.imagingResult && (formData.imagingResult.trim().length > 0 || formData.imagingResult === '[FILE_UPLOADED]');
    if (formData.imagingType) score += 3;
    if (hasImagingResults) score += 6; else score -= 3;

    // Objective findings & impairment/work
    const hasObjectiveFindings = formData.objectiveFindings && (formData.objectiveFindings.trim().length > 0 || formData.objectiveFindings === '[FILE_UPLOADED]');
    if (hasObjectiveFindings) score += 8; else score -= 5;
    if (formData.functionalImpairment && formData.functionalImpairment !== 'none') score += 6; else score -= 3;
    if (formData.workStatus === 'off') score += 6; else if (formData.workStatus === 'modified') score += 3;

    // Pain scale (simple)
    if (painScale[0] >= 7) score += 4; else if (painScale[0] >= 4) score += 2; else score -= 2;

    // Proportional boost based on how much is typed across text fields
    const textFields = [
      formData.patientName,
      formData.memberId,
      formData.groupNumber,
      formData.providerName,
      formData.icd10,
      formData.cpt,
      formData.procedure,
      formData.anatomicalLocation,
      formData.medicationName,
      formData.medicationDuration,
      formData.injectionType,
      formData.imagingResult,
      formData.objectiveFindings
    ].filter(Boolean) as string[];

    const totalChars = textFields.reduce((sum, v) => sum + v.replace(/\[FILE_UPLOADED\]/g, '').trim().length, 0);
    // Up to +12 points for rich content (roughly +1 per ~100 chars)
    score += Math.min(12, Math.floor(totalChars / 100));

    // Proportional boost based on filled fields (soft +0..8)
    const allValues = Object.values(formData);
    const filledCount = allValues.filter(v => {
      if (typeof v !== 'string') return !!v;
      return v.trim().length > 0 && v !== '[FILE_UPLOADED]';
    }).length;
    const ratio = allValues.length > 0 ? filledCount / allValues.length : 0;
    score += Math.round(ratio * 8);

    // Clamp
    score = Math.max(1, Math.min(95, score));
    return score;
  };

  const buildLocalRecommendations = () => {
    const recs: { action: string; impact: string; effort: string; priority: string }[] = [];
    const ptWeeksNum = parseInt(String(formData.ptWeeks || '0'), 10) || 0;
    const hasNSAID = !!formData.medicationName;
    const hasObjectiveFindings = formData.objectiveFindings && (formData.objectiveFindings.trim().length > 0 || formData.objectiveFindings === '[FILE_UPLOADED]');
    const hasImagingResults = formData.imagingResult && (formData.imagingResult.trim().length > 0 || formData.imagingResult === '[FILE_UPLOADED]');
    const cptOk = validateCPTCode(formData.cpt).isValid;
    const icdOk = validateICD10Code(formData.icd10).isValid;

    if (!cptOk) recs.push({ action: 'Enter a valid CPT (5-digit) for the requested procedure', impact: 'High impact', effort: 'Low effort', priority: 'HIGH' });
    if (!icdOk) recs.push({ action: 'Enter a valid ICD-10 code aligned with the procedure', impact: 'High impact', effort: 'Low effort', priority: 'HIGH' });
    if (ptWeeksNum < 6) recs.push({ action: 'Increase/Document PT to ≥ 6–8 weeks', impact: 'High impact', effort: 'Medium effort', priority: 'QUICK WIN' });
    if (!hasNSAID) recs.push({ action: 'Document ≥4–6 weeks NSAID trial with dosing', impact: 'High impact', effort: 'Low effort', priority: 'QUICK WIN' });
    if (!hasObjectiveFindings) recs.push({ action: 'Add objective neuro findings (e.g., SLR, reflex, strength)', impact: 'High impact', effort: 'Low effort', priority: 'HIGH' });
    if (!hasImagingResults) recs.push({ action: 'Add prior imaging summary or upload report', impact: 'Medium impact', effort: 'Low effort', priority: 'MEDIUM' });
    if (formData.workStatus !== 'off' && formData.workStatus !== 'modified') recs.push({ action: 'Document functional/work impairment explicitly', impact: 'High impact', effort: 'Low effort', priority: 'HIGH' });
    if (painScale[0] < 6) recs.push({ action: 'Clarify pain severity and functional limitation', impact: 'Medium impact', effort: 'Low effort', priority: 'MEDIUM' });
    if (formData.insurance === 'united' || formData.insurance === 'medicaid') recs.push({ action: 'Cite payer policy criteria in documentation', impact: 'Medium impact', effort: 'Low effort', priority: 'MEDIUM' });

    return recs;
  };

  const approvalRate = calculateApprovalRate();
  const displayScore = backendScore ?? approvalRate;

  const getMissingFields = () => {
    const missing = [];
    
    // Check objective findings - consider it complete if it has content OR if it contains upload confirmation
    const hasObjectiveFindings = formData.objectiveFindings && 
      (formData.objectiveFindings.trim().length > 0 || 
       formData.objectiveFindings === '[FILE_UPLOADED]');
    
    if (!hasObjectiveFindings) missing.push("Objective examination findings");
    
    // Check imaging results - consider it complete if it has content OR if it contains upload confirmation
    const hasImagingResults = formData.imagingResult && 
      (formData.imagingResult.trim().length > 0 || 
       formData.imagingResult === '[FILE_UPLOADED]');
    
    if (!hasImagingResults) missing.push("Imaging result summary");
    
    if (!formData.functionalImpairment || formData.functionalImpairment === "none") missing.push("Functional impairment documentation");
    if (!formData.ptWeeks) missing.push("Physical therapy duration");
    if (!formData.medicationName) missing.push("Medication trial details");
    return missing;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1">New Prior Authorization</h1>
        <p className="text-sm text-muted-foreground">
          {generated ? "Review and submit your authorization letter" : "Complete the authorization request form"}
        </p>
      </div>

      {!generated ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Patient & Insurance Info */}
            <Card>
              <CardHeader>
                <CardTitle>Patient & Insurance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      placeholder="John Smith"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => {
                        setFormData({ ...formData, dob: e.target.value });
                        validateField("dob", e.target.value);
                      }}
                      className={validationErrors.dob ? "border-red-500" : ""}
                    />
                    {validationErrors.dob && (
                      <p className="text-xs text-red-500">{validationErrors.dob}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="insurance">Insurance Provider</Label>
                  <Select value={formData.insurance} onValueChange={(v) => setFormData({ ...formData, insurance: v })}>
                    <SelectTrigger id="insurance">
                      <SelectValue placeholder="Select insurance provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="united">United Healthcare</SelectItem>
                      <SelectItem value="bcbs">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                      <SelectItem value="medicare">Medicare</SelectItem>
                      <SelectItem value="medicaid">Medicaid</SelectItem>
                      <SelectItem value="humana">Humana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberId">Member ID</Label>
                    <Input
                      id="memberId"
                      placeholder="ABC123456789"
                      value={formData.memberId}
                      onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupNumber">
                      Group Number <span className="text-xs text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="groupNumber"
                      placeholder="GRP001"
                      value={formData.groupNumber}
                      onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="providerName">Provider Name</Label>
                    <Input
                      id="providerName"
                      value={formData.providerName}
                      onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="npi">NPI Number</Label>
                    <Input
                      id="npi"
                      value={formData.npi}
                      onChange={(e) => setFormData({ ...formData, npi: e.target.value })}
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis & Procedure */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis & Procedure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icd10">ICD-10 Diagnosis Code</Label>
                    <Input
                      id="icd10"
                      placeholder="M54.5"
                      value={formData.icd10}
                      onChange={(e) => {
                        setFormData({ ...formData, icd10: e.target.value });
                        validateField("icd10", e.target.value);
                      }}
                      className={validationErrors.icd10 ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">e.g., M54.5 - Low back pain</p>
                    {validationErrors.icd10 && (
                      <p className="text-xs text-red-500">{validationErrors.icd10}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpt">CPT / Procedure Code</Label>
                    <Input
                      id="cpt"
                      placeholder="72148"
                      value={formData.cpt}
                      onChange={(e) => {
                        setFormData({ ...formData, cpt: e.target.value });
                        validateField("cpt", e.target.value);
                      }}
                      className={validationErrors.cpt ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">e.g., 72148 - MRI lumbar spine</p>
                    {validationErrors.cpt && (
                      <p className="text-xs text-red-500">{validationErrors.cpt}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procedure">Procedure Type</Label>
                  <Select value={formData.procedure} onValueChange={(v) => setFormData({ ...formData, procedure: v })}>
                    <SelectTrigger id="procedure">
                      <SelectValue placeholder="Select procedure type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mri">MRI</SelectItem>
                      <SelectItem value="ct">CT Scan</SelectItem>
                      <SelectItem value="surgery">Surgery</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="xray">X-ray</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="pet">PET Scan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anatomicalLocation">Anatomical Location</Label>
                  <Select value={formData.anatomicalLocation} onValueChange={(v) => setFormData({ ...formData, anatomicalLocation: v })}>
                    <SelectTrigger id="anatomicalLocation">
                      <SelectValue placeholder="Select anatomical location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lumbar">Lumbar Spine</SelectItem>
                      <SelectItem value="cervical">Cervical Spine</SelectItem>
                      <SelectItem value="thoracic">Thoracic Spine</SelectItem>
                      <SelectItem value="knee">Knee</SelectItem>
                      <SelectItem value="shoulder">Shoulder</SelectItem>
                      <SelectItem value="hip">Hip</SelectItem>
                      <SelectItem value="ankle">Ankle</SelectItem>
                      <SelectItem value="wrist">Wrist</SelectItem>
                      <SelectItem value="elbow">Elbow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symptomDuration">Duration of Symptoms</Label>
                    <Input
                      id="symptomDuration"
                      type="number"
                      min="1"
                      placeholder="12"
                      value={formData.symptomDuration}
                      onChange={(e) => setFormData({ ...formData, symptomDuration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symptomDurationUnit">Unit</Label>
                    <Select value={formData.symptomDurationUnit} onValueChange={(v) => setFormData({ ...formData, symptomDurationUnit: v })}>
                      <SelectTrigger id="symptomDurationUnit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment History */}
            <Card>
              <CardHeader>
                <CardTitle>Conservative Treatment History</CardTitle>
                <CardDescription>Document all prior treatments attempted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ptWeeks">Physical Therapy Duration (weeks)</Label>
                  <Input
                    id="ptWeeks"
                    type="number"
                    min="0"
                    placeholder="6"
                    value={formData.ptWeeks}
                    onChange={(e) => setFormData({ ...formData, ptWeeks: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicationName">Medication Name</Label>
                    <Input
                      id="medicationName"
                      placeholder="Ibuprofen 800mg"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicationDuration">Duration (weeks)</Label>
                    <Input
                      id="medicationDuration"
                      type="number"
                      min="0"
                      placeholder="6"
                      value={formData.medicationDuration}
                      onChange={(e) => setFormData({ ...formData, medicationDuration: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="injectionType">Injection Type</Label>
                    <Input
                      id="injectionType"
                      placeholder="Cortisone"
                      value={formData.injectionType}
                      onChange={(e) => setFormData({ ...formData, injectionType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injectionCount">Number of Injections</Label>
                    <Input
                      id="injectionCount"
                      type="number"
                      min="0"
                      placeholder="2"
                      value={formData.injectionCount}
                      onChange={(e) => setFormData({ ...formData, injectionCount: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imagingType">Prior Imaging Type</Label>
                      <Select value={formData.imagingType} onValueChange={(v) => setFormData({ ...formData, imagingType: v })}>
                        <SelectTrigger id="imagingType">
                          <SelectValue placeholder="Select imaging type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xray">X-ray</SelectItem>
                          <SelectItem value="mri">MRI</SelectItem>
                          <SelectItem value="ct">CT Scan</SelectItem>
                          <SelectItem value="ultrasound">Ultrasound</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imagingDate">Imaging Date</Label>
                      <Input
                        id="imagingDate"
                        type="date"
                        value={formData.imagingDate}
                        onChange={(e) => setFormData({ ...formData, imagingDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imagingResult">Imaging Result Summary</Label>
                    <div className="space-y-2">
                      <Textarea
                        id="imagingResult"
                        placeholder="Brief summary of findings..."
                        value={formData.imagingResult === '[FILE_UPLOADED]' ? '' : formData.imagingResult}
                        onChange={(e) => setFormData({ ...formData, imagingResult: e.target.value })}
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="imagingResultFile"
                          accept=".pdf,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload('imagingResult', e.target.files)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('imagingResultFile')?.click()}
                          disabled={isProcessingFile}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {isProcessingFile ? 'Processing...' : 'Upload PDF/JPG'}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Upload document to auto-fill
                        </span>
                        {formData.imagingResult && 
                         formData.imagingResult === '[FILE_UPLOADED]' && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>File uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Evidence */}
            <Card>
              <CardHeader>
                <CardTitle>Clinical Evidence</CardTitle>
                <CardDescription>Document current clinical status and examination findings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="painScale">Pain Scale (0-10)</Label>
                    <Badge variant="outline" className="text-sm">{painScale[0]}/10</Badge>
                  </div>
                  <Slider
                    id="painScale"
                    min={0}
                    max={10}
                    step={1}
                    value={painScale}
                    onValueChange={setPainScale}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>No Pain</span>
                    <span>Worst Pain</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="functionalImpairment">Functional Impairment</Label>
                  <Select value={formData.functionalImpairment} onValueChange={(v) => setFormData({ ...formData, functionalImpairment: v })}>
                    <SelectTrigger id="functionalImpairment">
                      <SelectValue placeholder="Select impairment level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild - Minimal impact on daily activities</SelectItem>
                      <SelectItem value="moderate">Moderate - Significant limitations in daily activities</SelectItem>
                      <SelectItem value="severe">Severe - Unable to perform normal activities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workStatus">Work Status</Label>
                  <Select value={formData.workStatus} onValueChange={(v) => setFormData({ ...formData, workStatus: v })}>
                    <SelectTrigger id="workStatus">
                      <SelectValue placeholder="Select work status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">Working Full Duty</SelectItem>
                      <SelectItem value="modified">Modified / Light Duty</SelectItem>
                      <SelectItem value="off">Off Work</SelectItem>
                      <SelectItem value="retired">Retired / Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectiveFindings">Objective Findings</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="objectiveFindings"
                      placeholder="Document examination findings, range of motion, neurological signs, strength testing, positive tests (e.g., straight leg raise, reflex changes, sensory deficits)..."
                      value={formData.objectiveFindings === '[FILE_UPLOADED]' ? '' : formData.objectiveFindings}
                      onChange={(e) => setFormData({ ...formData, objectiveFindings: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="objectiveFindingsFile"
                        accept=".pdf,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload('objectiveFindings', e.target.files)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('objectiveFindingsFile')?.click()}
                        disabled={isProcessingFile}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {isProcessingFile ? 'Processing...' : 'Upload PDF/JPG'}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Upload document to auto-fill
                      </span>
                      {formData.objectiveFindings && 
                       formData.objectiveFindings === '[FILE_UPLOADED]' && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>File uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Generation */}
            <Button 
              onClick={handleGenerateLetter} 
              disabled={isGeneratingLetter}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGeneratingLetter ? 'Generating with AI...' : 'Generate AI Letter'}
            </Button>

            {/* Legacy local generation (kept for fallback/manual use) */}
          </div>

          {/* AI Analysis Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Analysis
                </CardTitle>
                <CardDescription>Real-time approval prediction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Health Status */}
                {apiHealthy === false && (
                  <div className="rounded-md border border-[#EF4444]/20 bg-[#EF4444]/5 p-3 text-xs text-[#EF4444]">
                    API unavailable - showing local calculation
                  </div>
                )}

                {/* API Error */}
                {apiError && (
                  <div className="rounded-md border border-[#EF4444]/20 bg-[#EF4444]/5 p-3 text-xs text-[#EF4444]">
                    {apiError}
                  </div>
                )}

                {/* File Processing Error */}
                {fileProcessingError && (
                  <div className="rounded-md border border-[#EF4444]/20 bg-[#EF4444]/5 p-3 text-xs text-[#EF4444]">
                    {fileProcessingError}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Approval Probability</span>
                    <div className="flex items-center gap-2">
                      {isLoading && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span className={`font-medium ${displayScore >= 75 ? 'text-[#10B981]' : displayScore >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                        {displayScore}%
                      </span>
                    </div>
                  </div>
                  <Progress value={displayScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? 'Analyzing with AI...' : 
                     backendConfidence ? `Confidence: ${backendConfidence}` :
                     `Based on ${approvalRate >= 75 ? 'strong' : approvalRate >= 50 ? 'moderate' : 'weak'} documentation completeness`}
                  </p>
                </div>

                {getMissingFields().length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Missing Documentation</h4>
                      {getMissingFields().map((field, i) => (
                        <div key={i} className="rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/20 p-3">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium">{field}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">AI Analysis</h4>
                  
                  {/* Backend Factors */}
                  {(backendPositiveFactors.length > 0 || backendRiskFactors.length > 0) && (
                    <div className="grid grid-cols-1 gap-3">
                      {backendPositiveFactors.length > 0 && (
                        <div className="rounded-lg bg-[#10B981]/5 border border-[#10B981]/20 p-3 space-y-2">
                          <h5 className="text-xs font-medium text-[#10B981]">Positive Factors</h5>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {backendPositiveFactors.map((factor, i) => (
                              <li key={`positive-${i}`}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {backendRiskFactors.length > 0 && (
                        <div className="rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/20 p-3 space-y-2">
                          <h5 className="text-xs font-medium text-[#EF4444]">Risk Factors</h5>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {backendRiskFactors.map((factor, i) => (
                              <li key={`risk-${i}`}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Backend Recommendations */}
                  {backendRecommendations.length > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                      <h5 className="text-xs font-medium text-primary">AI Recommendations</h5>
                      <div className="space-y-2">
                        {backendRecommendations.map((rec, i) => (
                          <div key={`rec-${i}`} className="text-xs border-l-2 border-primary/30 pl-2">
                            <div className="font-medium">{rec.action}</div>
                            <div className="text-muted-foreground">
                              <span className="text-[#10B981]">{rec.impact}</span> • 
                              <span className="text-[#F59E0B]"> {rec.effort}</span> • 
                              <span className={`${rec.priority === 'QUICK WIN' ? 'text-[#10B981]' : rec.priority === 'HIGH' ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                                {rec.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-[#10B981]/5 border border-[#10B981]/20 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">AI Enhancement Active</p>
                        <p className="text-xs text-muted-foreground">
                          Letter will include optimized medical terminology and phrasing to maximize approval likelihood
                        </p>
                      </div>
                    </div>
                  </div>

                  {formData.objectiveFindings && (
                    <div className="rounded-lg bg-[#10B981]/5 border border-[#10B981]/20 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Strong Clinical Evidence</p>
                          <p className="text-xs text-muted-foreground">
                            Objective findings documented
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{Math.round((Object.values(formData).filter(v => v !== "").length / Object.keys(formData).length) * 100)}%</span>
                </div>
                <Progress value={(Object.values(formData).filter(v => v !== "").length / Object.keys(formData).length) * 100} className="h-1.5" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        generatedLetter ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Generated Authorization Letter</CardTitle>
                  <CardDescription>
                    Generated by Claude AI based on your form data and context guidelines
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedLetter.content)}>
                    <Copy className="w-3 h-3 mr-2" />
                    Copy Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrintLetter}>
                    <Download className="w-3 h-3 mr-2" />
                    Download PDF
                  </Button>
                  <Button size="sm" onClick={handleGenerateLetter}>
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/30 p-6 max-h-96 overflow-y-auto border" ref={letterRef}>
                <div className="space-y-4 text-sm whitespace-pre-wrap">
                  {generatedLetter.content}
                </div>
              </div>

              {/* AI Suggestions removed by request */}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-[#10B981]">
                <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Authorization Letter Generated</CardTitle>
                  <CardDescription className="text-[#10B981]/70">Ready for review and submission</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Click "Generate AI Letter" to create your authorization letter</p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-gray-400 shadow-xl p-6 w-fit min-w-96 max-w-2xl rounded-lg" style={{backgroundColor: '#ffffff', opacity: 1}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Validation Errors</h3>
              <button 
                onClick={() => setShowValidationPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700">
              <p className="mb-3 font-medium">Please fix the following errors before generating the letter:</p>
              <ul className="list-disc list-inside space-y-2 max-h-64 overflow-y-auto">
                {validateAllFields().map((error, index) => (
                  <li key={index} className="text-red-600">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Claude Error Display */}
      {claudeError && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Claude AI Error</p>
                <p className="text-xs text-red-600">{claudeError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

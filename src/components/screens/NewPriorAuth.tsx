import { useState } from "react";
import { AlertCircle, CheckCircle, Copy, Download, Sparkles, Send, Plus, X } from "lucide-react";
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

export function NewPriorAuth() {
  const [generated, setGenerated] = useState(false);
  const [painScale, setPainScale] = useState([7]);
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

  const handleGenerate = () => {
    setGenerated(true);
  };

  const calculateApprovalRate = () => {
    let score = 50;
    if (formData.patientName && formData.insurance) score += 5;
    if (formData.icd10 && formData.cpt) score += 10;
    if (formData.ptWeeks) score += 10;
    if (formData.medicationName) score += 8;
    if (painScale[0] >= 6) score += 7;
    if (formData.functionalImpairment === "severe" || formData.functionalImpairment === "moderate") score += 10;
    if (formData.workStatus === "off") score += 8;
    if (formData.objectiveFindings) score += 12;
    return Math.min(score, 95);
  };

  const approvalRate = calculateApprovalRate();

  const getMissingFields = () => {
    const missing = [];
    if (!formData.objectiveFindings) missing.push("Objective examination findings");
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
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
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
                      onChange={(e) => setFormData({ ...formData, icd10: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">e.g., M54.5 - Low back pain</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpt">CPT / Procedure Code</Label>
                    <Input
                      id="cpt"
                      placeholder="72148"
                      value={formData.cpt}
                      onChange={(e) => setFormData({ ...formData, cpt: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">e.g., 72148 - MRI lumbar spine</p>
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
                    <Textarea
                      id="imagingResult"
                      placeholder="Brief summary of findings..."
                      value={formData.imagingResult}
                      onChange={(e) => setFormData({ ...formData, imagingResult: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
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
                  <Textarea
                    id="objectiveFindings"
                    placeholder="Document examination findings, range of motion, neurological signs, strength testing, positive tests (e.g., straight leg raise, reflex changes, sensory deficits)..."
                    value={formData.objectiveFindings}
                    onChange={(e) => setFormData({ ...formData, objectiveFindings: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={handleGenerate}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Authorization Letter
            </Button>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Approval Probability</span>
                    <span className={`font-medium ${approvalRate >= 75 ? 'text-[#10B981]' : approvalRate >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                      {approvalRate}%
                    </span>
                  </div>
                  <Progress value={approvalRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on {approvalRate >= 75 ? 'strong' : approvalRate >= 50 ? 'moderate' : 'weak'} documentation completeness
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
                  <h4 className="text-sm font-medium">Optimization Tips</h4>
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
            <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4 text-sm max-h-[500px] overflow-y-auto">
              <div>
                <p>Dear {formData.insurance ? formData.insurance.charAt(0).toUpperCase() + formData.insurance.slice(1) : "Insurance"} Prior Authorization Department,</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">RE: Prior Authorization Request</p>
                <p>Patient: {formData.patientName || "Patient Name"}</p>
                <p>Date of Birth: {formData.dob || "DOB"}</p>
                <p>Member ID: {formData.memberId || "Member ID"}</p>
                <p>Procedure: {formData.procedure ? formData.procedure.toUpperCase() : "Procedure"} - {formData.anatomicalLocation || "Location"}</p>
                <p>ICD-10: {formData.icd10 || "ICD-10 Code"}</p>
                <p>CPT: {formData.cpt || "CPT Code"}</p>
              </div>
              <div className="space-y-2">
                <p>
                  I am writing to request prior authorization for the above-referenced procedure. This patient presents
                  with a {formData.symptomDuration || "12"} {formData.symptomDurationUnit} history of symptoms that have failed conservative management.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Conservative Treatment History:</p>
                <p>
                  The patient has completed an extensive conservative treatment regimen without significant clinical
                  improvement:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {formData.ptWeeks && <li>Physical therapy: {formData.ptWeeks} weeks with minimal improvement in functional status</li>}
                  {formData.medicationName && <li>Medications: {formData.medicationName} for {formData.medicationDuration || "several"} weeks with inadequate pain relief</li>}
                  {formData.injectionType && <li>{formData.injectionType} injections: {formData.injectionCount || "Multiple"} injections with only temporary relief</li>}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Clinical Presentation:</p>
                <p>
                  The patient reports pain scale of {painScale[0]}/10 with {formData.functionalImpairment || "significant"} functional impairment.
                  Current work status: {formData.workStatus || "impacted"}. {formData.objectiveFindings || "Clinical examination reveals findings consistent with the diagnosis."}
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Medical Necessity:</p>
                <p>
                  Given the failed conservative treatment course, persistent symptoms, and significant
                  functional impairment, the requested procedure is medically necessary to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Identify underlying pathology requiring intervention</li>
                  <li>Guide appropriate treatment planning</li>
                  <li>Evaluate for potential surgical candidacy if indicated</li>
                  <li>Prevent further deterioration and complications</li>
                </ul>
                <p>
                  This request meets your organization's medical necessity criteria and clinical guidelines for
                  this procedure following failed conservative management.
                </p>
              </div>
              <div>
                <p>Thank you for your prompt consideration of this request.</p>
                <p className="mt-4">Sincerely,</p>
                <p>{formData.providerName || "Provider Name"}, MD</p>
                <p className="text-xs text-muted-foreground">NPI: {formData.npi || "NPI Number"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Submit to Portal
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

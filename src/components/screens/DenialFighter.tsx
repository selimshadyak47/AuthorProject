import { useState, useRef } from "react";
import { AlertCircle, CheckCircle, Copy, Download, FileText, Upload, XCircle, Send, ArrowLeft, Search, Info, Check, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";

interface DeniedCase {
  id: string;
  patient: string;
  procedure: string;
  insurance: string;
  amount: string;
  denialDate: string;
  denialReason: string;
  detailedAnalysis?: {
    primaryReason: string;
    realMeaning: string;
    missingDocuments?: string[];
    policyViolation?: string;
    recommendedActions: string[];
    similarCases: {
      total: number;
      successful: number;
    };
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  reason: string;
  completed: boolean;
  files: File[];
  notes: string;
}

export function DenialFighter() {
  const [selectedCase, setSelectedCase] = useState<DeniedCase | null>(null);
  const [denialLetterUploaded, setDenialLetterUploaded] = useState(false);
  const [denialLetterFile, setDenialLetterFile] = useState<File | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [successProbability, setSuccessProbability] = useState(84);
  const [additionalComments, setAdditionalComments] = useState("");
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  
  const denialLetterInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesInputRef = useRef<HTMLInputElement>(null);

  const deniedCases: DeniedCase[] = [
    {
      id: "PA-2024-003",
      patient: "Tom Davidson",
      procedure: "CT Scan Lumbar",
      insurance: "Aetna",
      amount: "$8,500",
      denialDate: "Oct 14, 2024",
      denialReason: "Not medically necessary",
      detailedAnalysis: {
        primaryReason: "Not medically necessary",
        realMeaning: "Missing documentation of functional impairment and conservative treatment failure",
        missingDocuments: [
          "Physical therapy progress notes (minimum 6 weeks)",
          "Documentation of failed conservative treatments",
          "Pain scale progression chart"
        ],
        policyViolation: "Aetna Clinical Policy Bulletin 0157: Advanced imaging requires 6-8 weeks of documented conservative treatment failure",
        recommendedActions: [
          "Obtain and attach all physical therapy session notes",
          "Document patient's pain progression with objective measurements",
          "Provide detailed timeline showing treatment progression",
          "Cite medical literature supporting early imaging for this specific condition"
        ],
        similarCases: {
          total: 47,
          successful: 39
        }
      }
    },
    {
      id: "PA-2024-007",
      patient: "Patricia Miller",
      procedure: "MRI Lumbar Spine",
      insurance: "Blue Cross Blue Shield",
      amount: "$4,200",
      denialDate: "Oct 10, 2024",
      denialReason: "Insufficient documentation",
      detailedAnalysis: {
        primaryReason: "Insufficient documentation",
        realMeaning: "Missing clinical examination findings and neurological assessment",
        missingDocuments: [
          "Complete clinical examination findings",
          "Neurological assessment results",
          "Prior treatment history and outcomes"
        ],
        policyViolation: "BCBS Medical Policy 2.01.17: MRI requires documented physical examination and failed conservative treatment",
        recommendedActions: [
          "Provide detailed neurological examination findings",
          "Document all conservative treatments attempted",
          "Include patient's functional limitations",
          "Reference clinical guidelines supporting imaging"
        ],
        similarCases: {
          total: 32,
          successful: 28
        }
      }
    },
    {
      id: "PA-2024-011",
      patient: "James Wilson",
      procedure: "Spinal Surgery",
      insurance: "Medicare",
      amount: "$52,000",
      denialDate: "Oct 8, 2024",
      denialReason: "Experimental treatment",
    },
    {
      id: "PA-2024-015",
      patient: "Maria Garcia",
      procedure: "Hip Replacement",
      insurance: "United Healthcare",
      amount: "$38,000",
      denialDate: "Oct 5, 2024",
      denialReason: "Not medically necessary",
    },
  ];

  const handleSelectCase = (caseItem: DeniedCase) => {
    setSelectedCase(caseItem);
    setDenialLetterUploaded(false);
    setDenialLetterFile(null);
    setChecklistItems([]);
    setSuccessProbability(84);
    setAdditionalComments("");
    setAdditionalFiles([]);
  };

  const handleDenialLetterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDenialLetterFile(file);
      setDenialLetterUploaded(true);
      
      // ===== AI BACKEND INTEGRATION POINT =====
      // TODO: Replace the simulation below with your AI backend API call
      // 
      // Example implementation:
      // const formData = new FormData();
      // formData.append('denialLetter', file);
      // formData.append('caseId', selectedCase.id);
      // 
      // const response = await fetch('/api/analyze-denial', {
      //   method: 'POST',
      //   body: formData
      // });
      // 
      // const analysis = await response.json();
      // Expected response format:
      // {
      //   missingDocuments: [
      //     {
      //       label: "Physical therapy progress notes",
      //       reason: "Required to demonstrate conservative treatment failure"
      //     },
      //     // ... more items
      //   ],
      //   realMeaning: "Missing documentation of functional impairment...",
      //   successProbability: 84
      // }
      //
      // setChecklistItems(analysis.missingDocuments.map((doc, idx) => ({
      //   id: String(idx + 1),
      //   label: doc.label,
      //   reason: doc.reason,
      //   completed: false,
      //   files: [],
      //   notes: ""
      // })));
      // ===== END AI BACKEND INTEGRATION POINT =====
      
      if (selectedCase?.detailedAnalysis?.missingDocuments) {
        const items: ChecklistItem[] = selectedCase.detailedAnalysis.missingDocuments.map((doc, index) => ({
          id: String(index + 1),
          label: doc,
          reason: "Required to meet insurer's medical necessity criteria",
          completed: false,
          files: [],
          notes: ""
        }));
        setChecklistItems(items);
      }
    }
  };

  const handleChecklistFileUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setChecklistItems(items =>
        items.map(item => {
          if (item.id === itemId) {
            const newFiles = [...item.files, ...fileArray];
            return { ...item, files: newFiles, completed: newFiles.length > 0 || item.notes.trim().length > 0 };
          }
          return item;
        })
      );
      calculateSuccessProbability();
    }
  };

  const handleChecklistNotesChange = (itemId: string, value: string) => {
    setChecklistItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          return { ...item, notes: value, completed: value.trim().length > 0 || item.files.length > 0 };
        }
        return item;
      })
    );
    calculateSuccessProbability();
  };

  const handleRemoveChecklistFile = (itemId: string, fileIndex: number) => {
    setChecklistItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newFiles = item.files.filter((_, index) => index !== fileIndex);
          return { ...item, files: newFiles, completed: newFiles.length > 0 || item.notes.trim().length > 0 };
        }
        return item;
      })
    );
    calculateSuccessProbability();
  };

  const handleAdditionalFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setAdditionalFiles([...additionalFiles, ...fileArray]);
    }
  };

  const handleRemoveAdditionalFile = (fileIndex: number) => {
    setAdditionalFiles(additionalFiles.filter((_, index) => index !== fileIndex));
  };

  const calculateSuccessProbability = () => {
    setTimeout(() => {
      const completedCount = checklistItems.filter(item => item.completed).length;
      const totalCount = checklistItems.length;
      if (totalCount > 0) {
        const newProbability = 84 + Math.floor((completedCount / totalCount) * 16);
        setSuccessProbability(newProbability);
      }
    }, 100);
  };

  const handleBack = () => {
    setSelectedCase(null);
    setDenialLetterUploaded(false);
    setDenialLetterFile(null);
    setChecklistItems([]);
    setAdditionalComments("");
    setAdditionalFiles([]);
  };

  const handleCopyLetter = () => {
    if (!selectedCase) return;
    
    // Generate the appeal letter text
    const appealLetterText = generateAppealLetterText();
    
    // Copy to clipboard
    navigator.clipboard.writeText(appealLetterText).then(() => {
      showNotification("Copied to clipboard");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = appealLetterText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showNotification("Copied to clipboard");
    });
  };

  const showNotification = (message: string) => {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300";
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const handleDownloadPDF = () => {
    if (!selectedCase) return;
    
    // Generate the appeal letter text
    const appealLetterText = generateAppealLetterText();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Appeal Letter - ${selectedCase.patient}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              .header { margin-bottom: 30px; }
              .content { margin-bottom: 20px; }
              .footer { margin-top: 30px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <p><strong>To: ${selectedCase.insurance} Appeals Department</strong></p>
              <p>Re: Appeal for Prior Authorization Denial</p>
              <p>Case ID: ${selectedCase.id}</p>
              <p>Patient: ${selectedCase.patient}</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="content">
              ${appealLetterText.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <p>Sincerely,</p>
              <p><strong>Dr. [Physician Name]</strong></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const generateAppealLetterText = () => {
    if (!selectedCase) return "";
    
    let letterText = `Dear Appeals Review Team,

I am writing to appeal the denial of prior authorization for ${selectedCase.procedure} for my patient, ${selectedCase.patient}. 
The initial request was denied on ${selectedCase.denialDate} with the stated reason: "${selectedCase.denialReason}."

This appeal provides additional clinical documentation and evidence that demonstrates the medical necessity 
of this procedure for this patient's specific condition.

Clinical Justification:
The patient has undergone extensive conservative treatment as outlined in the attached documentation. 
Physical therapy notes spanning 8 weeks show progressive treatment without adequate improvement. 
Pain scale documentation demonstrates ongoing functional impairment affecting daily activities.`;

    // Add completed checklist items
    const completedItems = checklistItems.filter(item => item.completed);
    if (completedItems.length > 0) {
      letterText += `\n\nSupporting Documentation Provided:`;
      completedItems.forEach(item => {
        letterText += `\n• ${item.label}`;
        if (item.notes) {
          letterText += `\n  ${item.notes}`;
        }
      });
    }

    // Add additional comments
    if (additionalComments) {
      letterText += `\n\nAdditional Clinical Context:\n${additionalComments}`;
    }

    letterText += `\n\nMedical Necessity:
Based on current clinical guidelines and the patient's documented treatment history, 
this imaging study is medically necessary to properly diagnose and develop an appropriate treatment plan. 
Delay in obtaining this study may result in prolonged disability and increased healthcare costs.`;

    // Add attached documents
    const allFiles = [
      ...completedItems.flatMap(item => item.files),
      ...additionalFiles
    ];
    
    if (allFiles.length > 0) {
      letterText += `\n\nAttached Documents:`;
      allFiles.forEach(file => {
        letterText += `\n• ${file.name}`;
      });
    }

    letterText += `\n\nI respectfully request that you review the attached comprehensive documentation and reconsider 
the denial of this medically necessary procedure. Should you require any additional information, 
please do not hesitate to contact me directly.

Sincerely,
Dr. [Physician Name]`;

    return letterText;
  };

  const handleRegenerateLetter = () => {
    alert("Regenerating appeal letter with updated information...");
  };

  // List view - show all denied cases
  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-1">Denied Cases</h1>
          <p className="text-sm text-muted-foreground">
            Select a case to generate an appeal
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search denied cases..." className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {deniedCases.map((item, index) => (
                <div key={item.id}>
                  <div className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <XCircle className="w-4 h-4 text-[#EF4444]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{item.patient}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.procedure}</p>
                    </div>

                    <div className="text-right w-32">
                      <p className="text-xs text-muted-foreground mb-1">{item.insurance}</p>
                      <p className="text-sm font-medium">{item.amount}</p>
                    </div>

                    <div className="w-40">
                      <p className="text-xs text-muted-foreground mb-1">Denial reason</p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-[#EF4444] line-clamp-1">{item.denialReason}</p>
                        {item.detailedAnalysis && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                                <Info className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detailed Denial Analysis</DialogTitle>
                                <DialogDescription>
                                  AI-powered analysis of denial reason and recommended actions
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Primary Reason</Label>
                                  <p className="text-sm text-muted-foreground mt-1">{item.detailedAnalysis.primaryReason}</p>
                                </div>

                                {item.detailedAnalysis.missingDocuments && (
                                  <div>
                                    <Label className="text-sm font-medium">Missing Documentation</Label>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                      {item.detailedAnalysis.missingDocuments.map((doc, i) => (
                                        <li key={i}>{doc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {item.detailedAnalysis.policyViolation && (
                                  <div>
                                    <Label className="text-sm font-medium">Policy Reference</Label>
                                    <p className="text-sm text-muted-foreground mt-1">{item.detailedAnalysis.policyViolation}</p>
                                  </div>
                                )}

                                <div>
                                  <Label className="text-sm font-medium">Recommended Actions</Label>
                                  <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                    {item.detailedAnalysis.recommendedActions.map((action, i) => (
                                      <li key={i}>{action}</li>
                                    ))}
                                  </ol>
                                </div>

                                <div className="rounded-lg bg-primary/5 p-4">
                                  <Label className="text-sm font-medium">Historical Success Rate</Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.detailedAnalysis.similarCases.successful} out of {item.detailedAnalysis.similarCases.total} similar appeals were successful ({Math.round((item.detailedAnalysis.similarCases.successful / item.detailedAnalysis.similarCases.total) * 100)}% success rate)
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>

                    <div className="w-24 text-right">
                      <p className="text-xs text-muted-foreground">{item.denialDate}</p>
                    </div>

                    <div className="w-24">
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => handleSelectCase(item)}>
                        Appeal
                      </Button>
                    </div>
                  </div>
                  {index < deniedCases.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case selected - show upload or dynamic workflow
  if (!denialLetterUploaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to cases
          </Button>
        </div>

        <div>
          <h1 className="mb-1">Create Appeal</h1>
          <p className="text-sm text-muted-foreground">
            {selectedCase.patient} · {selectedCase.id}
          </p>
        </div>

        <Card className="border-[#EF4444]/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <CardTitle>Denial Details</CardTitle>
                <CardDescription>Case denied on {selectedCase.denialDate}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Procedure</p>
                <p className="text-sm font-medium">{selectedCase.procedure}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Insurance</p>
                <p className="text-sm font-medium">{selectedCase.insurance}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="text-sm font-medium">{selectedCase.amount}</p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground mb-1">Denial Reason</p>
                  {selectedCase.detailedAnalysis && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6">
                          <Info className="w-3 h-3 mr-1" />
                          See Full Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detailed Denial Analysis</DialogTitle>
                          <DialogDescription>
                            AI-powered analysis of denial reason and recommended actions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Primary Reason</Label>
                            <p className="text-sm text-muted-foreground mt-1">{selectedCase.detailedAnalysis.primaryReason}</p>
                          </div>

                          {selectedCase.detailedAnalysis.missingDocuments && (
                            <div>
                              <Label className="text-sm font-medium">Missing Documentation</Label>
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                                {selectedCase.detailedAnalysis.missingDocuments.map((doc, i) => (
                                  <li key={i}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedCase.detailedAnalysis.policyViolation && (
                            <div>
                              <Label className="text-sm font-medium">Policy Reference</Label>
                              <p className="text-sm text-muted-foreground mt-1">{selectedCase.detailedAnalysis.policyViolation}</p>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm font-medium">Recommended Actions</Label>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-1">
                              {selectedCase.detailedAnalysis.recommendedActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ol>
                          </div>

                          <div className="rounded-lg bg-primary/5 p-4">
                            <Label className="text-sm font-medium">Historical Success Rate</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedCase.detailedAnalysis.similarCases.successful} out of {selectedCase.detailedAnalysis.similarCases.total} similar appeals were successful ({Math.round((selectedCase.detailedAnalysis.similarCases.successful / selectedCase.detailedAnalysis.similarCases.total) * 100)}% success rate)
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-sm font-medium text-[#EF4444]">{selectedCase.denialReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Denial Letter</CardTitle>
            <CardDescription>Upload the official denial letter to begin AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={denialLetterInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleDenialLetterUpload}
              className="hidden"
            />
            <div 
              className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => denialLetterInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX files up to 10MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Denial letter uploaded - show dynamic workflow
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to cases
        </Button>
      </div>

      <div>
        <h1 className="mb-1">Appeal Builder</h1>
        <p className="text-sm text-muted-foreground">
          {selectedCase.patient} · {selectedCase.id}
        </p>
      </div>

      {/* AI Denial Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle>Denial Analysis Complete</CardTitle>
              <CardDescription>AI analysis completed in 2.3 seconds</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">What the Insurer Said</Label>
              <div className="rounded-lg border-l-4 border-[#EF4444] bg-background p-3">
                <p className="text-sm font-medium text-[#EF4444]">"{selectedCase.denialReason}"</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">What It Really Means</Label>
              <div className="rounded-lg border-l-4 border-primary bg-background p-3">
                <p className="text-sm font-medium">{selectedCase.detailedAnalysis?.realMeaning}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">AI Success Probability</Label>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {successProbability}%
              </Badge>
            </div>
            <Progress value={successProbability} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on {selectedCase.detailedAnalysis?.similarCases.total} similar cases
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Documentation Checklist from AI */}
      {checklistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Documentation</CardTitle>
            <CardDescription>
              AI-identified documentation needed to strengthen your appeal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center h-5 mt-1">
                      <Checkbox 
                        checked={item.completed}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-sm font-medium">{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Paste clinical notes or type details here..."
                          value={item.notes}
                          onChange={(e) => handleChecklistNotesChange(item.id, e.target.value)}
                          className="min-h-20 text-sm"
                        />
                        
                        <input
                          type="file"
                          id={`file-${item.id}`}
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleChecklistFileUpload(item.id, e)}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                          className="w-full"
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          Upload Documents
                        </Button>
                      </div>

                      {item.files.length > 0 && (
                        <div className="space-y-1">
                          {item.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                              <FileText className="w-3 h-3 text-muted-foreground" />
                              <span className="flex-1 truncate">{file.name}</span>
                              <span className="text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                                onClick={() => handleRemoveChecklistFile(item.id, index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.completed && (
                    <div className="ml-8 flex items-center gap-2 text-xs text-primary">
                      <Check className="w-3 h-3" />
                      <span>Documentation provided - appeal letter updated</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Comments and Files */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Add any extra context or supporting documents not covered above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Additional Comments</Label>
            <Textarea
              placeholder="Add any additional clinical notes, special circumstances, or context that may strengthen the appeal..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              className="min-h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Files</Label>
            <input
              ref={additionalFilesInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleAdditionalFilesUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => additionalFilesInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Additional Files
            </Button>

            {additionalFiles.length > 0 && (
              <div className="space-y-1 mt-2">
                {additionalFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveAdditionalFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appeal Letter Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Appeal Letter</CardTitle>
              <CardDescription>
                Letter automatically updates as you add documentation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLetter}>
                <Copy className="w-3 h-3 mr-2" />
                Copy Text
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-3 h-3 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/30 p-6 max-h-96 overflow-y-auto border">
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">To: {selectedCase.insurance} Appeals Department</p>
                <p className="text-muted-foreground">Re: Appeal for Prior Authorization Denial</p>
                <p className="text-muted-foreground">Case ID: {selectedCase.id}</p>
                <p className="text-muted-foreground">Patient: {selectedCase.patient}</p>
                <p className="text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <p>Dear Appeals Review Team,</p>
                
                <p>
                  I am writing to appeal the denial of prior authorization for {selectedCase.procedure} for my patient, {selectedCase.patient}. 
                  The initial request was denied on {selectedCase.denialDate} with the stated reason: "{selectedCase.denialReason}."
                </p>

                <p>
                  This appeal provides additional clinical documentation and evidence that demonstrates the medical necessity 
                  of this procedure for this patient's specific condition.
                </p>

                <div className="space-y-2">
                  <p className="font-medium">Clinical Justification:</p>
                  <p className="text-muted-foreground">
                    The patient has undergone extensive conservative treatment as outlined in the attached documentation. 
                    Physical therapy notes spanning 8 weeks show progressive treatment without adequate improvement. 
                    Pain scale documentation demonstrates ongoing functional impairment affecting daily activities.
                  </p>
                </div>

                {checklistItems.filter(item => item.completed).length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Supporting Documentation Provided:</p>
                    <div className="space-y-3">
                      {checklistItems.filter(item => item.completed).map((item) => (
                        <div key={item.id} className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">• {item.label}</p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground ml-4 whitespace-pre-wrap">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {additionalComments && (
                  <div className="space-y-2">
                    <p className="font-medium">Additional Clinical Context:</p>
                    <p className="text-muted-foreground">{additionalComments}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-medium">Medical Necessity:</p>
                  <p className="text-muted-foreground">
                    Based on current clinical guidelines and the patient's documented treatment history, 
                    this imaging study is medically necessary to properly diagnose and develop an appropriate treatment plan. 
                    Delay in obtaining this study may result in prolonged disability and increased healthcare costs.
                  </p>
                </div>

                {(checklistItems.filter(item => item.completed).length > 0 || additionalFiles.length > 0) && (
                  <div className="space-y-2">
                    <p className="font-medium">Attached Documents:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {checklistItems.filter(item => item.completed).flatMap(item => 
                        item.files.map((file, idx) => (
                          <li key={`${item.id}-${idx}`}>{file.name}</li>
                        ))
                      )}
                      {additionalFiles.map((file, idx) => (
                        <li key={`additional-${idx}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p>
                  I respectfully request that you review the attached comprehensive documentation and reconsider 
                  the denial of this medically necessary procedure. Should you require any additional information, 
                  please do not hesitate to contact me directly.
                </p>

                <p>Sincerely,</p>
                <p className="font-medium">Dr. [Physician Name]</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="outline" onClick={handleRegenerateLetter}>
              Regenerate Appeal Letter
            </Button>
            <Button size="lg">
              <Send className="w-4 h-4 mr-2" />
              Submit Appeal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

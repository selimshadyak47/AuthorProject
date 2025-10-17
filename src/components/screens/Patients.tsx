import { useState } from "react";
import { Search, ArrowLeft, Plus, CheckCircle, Clock, XCircle, FileText, Shield, Calendar, Activity, Pill, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  insurance: string;
  memberId: string;
  phone: string;
  email: string;
  totalRequests: number;
  approved: number;
  pending: number;
  denied: number;
  lastVisit: string;
  diagnoses: string[];
  medications: string[];
}

interface AuthorizationRequest {
  id: string;
  procedure: string;
  cpt: string;
  amount: string;
  status: "approved" | "pending" | "denied";
  date: string;
  denialReason?: string;
  hasAppeal?: boolean;
  clinicalNotes?: string;
  diagnosis: string;
}

interface Letter {
  id: string;
  type: "authorization" | "appeal";
  requestId: string;
  procedure: string;
  date: string;
  status: string;
}

interface TimelineEvent {
  id: string;
  type: "request" | "approval" | "denial" | "appeal" | "visit";
  title: string;
  description: string;
  date: string;
  status?: "approved" | "pending" | "denied";
}

interface PatientsProps {
  onNavigate: (screen: string) => void;
}

export function Patients({ onNavigate }: PatientsProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState("all");

  const patients: Patient[] = [
    {
      id: "PT-001",
      name: "Sarah Johnson",
      dob: "03/15/1978",
      age: 46,
      gender: "Female",
      insurance: "United Healthcare",
      memberId: "UHC-987654321",
      phone: "(555) 123-4567",
      email: "sarah.j@email.com",
      totalRequests: 8,
      approved: 6,
      pending: 1,
      denied: 1,
      lastVisit: "Oct 15, 2024",
      diagnoses: ["Chronic Lower Back Pain (M54.5)", "Sciatica (M54.3)"],
      medications: ["Ibuprofen 800mg TID", "Gabapentin 300mg BID"],
    },
    {
      id: "PT-002",
      name: "Mike Rodriguez",
      dob: "07/22/1985",
      age: 39,
      gender: "Male",
      insurance: "Blue Cross Blue Shield",
      memberId: "BCBS-123456789",
      phone: "(555) 234-5678",
      email: "mrodriguez@email.com",
      totalRequests: 12,
      approved: 9,
      pending: 2,
      denied: 1,
      lastVisit: "Oct 16, 2024",
      diagnoses: ["Rotator Cuff Tear (M75.1)", "Shoulder Impingement (M75.4)"],
      medications: ["Meloxicam 15mg QD", "Physical Therapy"],
    },
    {
      id: "PT-003",
      name: "Tom Davidson",
      dob: "11/08/1972",
      age: 52,
      gender: "Male",
      insurance: "Aetna",
      memberId: "AET-456789123",
      phone: "(555) 345-6789",
      email: "tdavidson@email.com",
      totalRequests: 15,
      approved: 10,
      pending: 0,
      denied: 5,
      lastVisit: "Oct 14, 2024",
      diagnoses: ["Lumbar Disc Herniation (M51.2)", "Radiculopathy (M54.1)"],
      medications: ["Prednisone 20mg QD", "Cyclobenzaprine 10mg QHS"],
    },
    {
      id: "PT-004",
      name: "Jennifer Lee",
      dob: "05/30/1990",
      age: 34,
      gender: "Female",
      insurance: "United Healthcare",
      memberId: "UHC-147258369",
      phone: "(555) 456-7890",
      email: "jlee@email.com",
      totalRequests: 5,
      approved: 3,
      pending: 2,
      denied: 0,
      lastVisit: "Oct 17, 2024",
      diagnoses: ["Hip Dysplasia (M25.8)", "Hip Pain (M25.5)"],
      medications: ["Naproxen 500mg BID"],
    },
    {
      id: "PT-005",
      name: "Lisa Kim",
      dob: "09/12/1983",
      age: 41,
      gender: "Female",
      insurance: "Cigna",
      memberId: "CGN-789123456",
      phone: "(555) 567-8901",
      email: "lkim@email.com",
      totalRequests: 6,
      approved: 5,
      pending: 0,
      denied: 1,
      lastVisit: "Oct 13, 2024",
      diagnoses: ["Knee Osteoarthritis (M17.0)"],
      medications: ["Tramadol 50mg PRN", "Acetaminophen 650mg QID"],
    },
    {
      id: "PT-006",
      name: "Robert Chen",
      dob: "01/25/1968",
      age: 56,
      gender: "Male",
      insurance: "Medicare",
      memberId: "MED-321654987",
      phone: "(555) 678-9012",
      email: "rchen@email.com",
      totalRequests: 20,
      approved: 18,
      pending: 1,
      denied: 1,
      lastVisit: "Oct 12, 2024",
      diagnoses: ["Spinal Stenosis (M48.0)", "Degenerative Disc Disease (M51.3)"],
      medications: ["Duloxetine 60mg QD", "Lidocaine Patch PRN"],
    },
  ];

  const authRequests: Record<string, AuthorizationRequest[]> = {
    "PT-003": [
      {
        id: "PA-2024-015",
        procedure: "MRI Cervical Spine",
        cpt: "72141",
        amount: "$3,800",
        status: "approved",
        date: "Sep 28, 2024",
        diagnosis: "Cervical Radiculopathy",
        clinicalNotes: "Patient reports persistent neck pain radiating to right arm. Failed 6 weeks conservative treatment.",
      },
      {
        id: "PA-2024-012",
        procedure: "Physical Therapy (12 sessions)",
        cpt: "97110",
        amount: "$1,440",
        status: "approved",
        date: "Sep 15, 2024",
        diagnosis: "Lumbar Disc Herniation",
        clinicalNotes: "Conservative management for disc herniation at L4-L5.",
      },
      {
        id: "PA-2024-008",
        procedure: "Epidural Steroid Injection",
        cpt: "62311",
        amount: "$2,200",
        status: "approved",
        date: "Aug 22, 2024",
        diagnosis: "Radiculopathy",
        clinicalNotes: "Failed oral medications and PT. Pain scale 8/10.",
      },
      {
        id: "PA-2024-003",
        procedure: "CT Scan Lumbar",
        cpt: "72132",
        amount: "$8,500",
        status: "denied",
        date: "Oct 14, 2024",
        denialReason: "Not medically necessary",
        hasAppeal: true,
        diagnosis: "Lumbar Disc Herniation",
        clinicalNotes: "Advanced imaging requested due to worsening symptoms despite treatment.",
      },
      {
        id: "PA-2024-001",
        procedure: "MRI Lumbar Spine",
        cpt: "72148",
        amount: "$4,200",
        status: "approved",
        date: "Jul 10, 2024",
        diagnosis: "Lumbar Disc Herniation",
        clinicalNotes: "Initial imaging to assess disc herniation.",
      },
    ],
    "PT-001": [
      {
        id: "PA-2024-025",
        procedure: "MRI Lumbar Spine",
        cpt: "72148",
        amount: "$4,200",
        status: "approved",
        date: "Oct 15, 2024",
        diagnosis: "Chronic Lower Back Pain",
        clinicalNotes: "Progressive symptoms, failed conservative treatment for 8 weeks.",
      },
    ],
  };

  const letters: Record<string, Letter[]> = {
    "PT-003": [
      {
        id: "LTR-2024-015",
        type: "authorization",
        requestId: "PA-2024-015",
        procedure: "MRI Cervical Spine",
        date: "Sep 28, 2024",
        status: "approved",
      },
      {
        id: "LTR-2024-012",
        type: "authorization",
        requestId: "PA-2024-012",
        procedure: "Physical Therapy",
        date: "Sep 15, 2024",
        status: "approved",
      },
      {
        id: "LTR-2024-003A",
        type: "appeal",
        requestId: "PA-2024-003",
        procedure: "CT Scan Lumbar - Appeal",
        date: "Oct 16, 2024",
        status: "pending",
      },
      {
        id: "LTR-2024-003",
        type: "authorization",
        requestId: "PA-2024-003",
        procedure: "CT Scan Lumbar",
        date: "Oct 14, 2024",
        status: "denied",
      },
    ],
  };

  const timeline: Record<string, TimelineEvent[]> = {
    "PT-003": [
      {
        id: "TL-001",
        type: "appeal",
        title: "Appeal Submitted",
        description: "CT Scan Lumbar appeal letter submitted to Aetna",
        date: "Oct 16, 2024",
        status: "pending",
      },
      {
        id: "TL-002",
        type: "denial",
        title: "Authorization Denied",
        description: "CT Scan Lumbar - Reason: Not medically necessary",
        date: "Oct 14, 2024",
        status: "denied",
      },
      {
        id: "TL-003",
        type: "visit",
        title: "Office Visit",
        description: "Follow-up visit - discussed imaging options",
        date: "Oct 12, 2024",
      },
      {
        id: "TL-004",
        type: "approval",
        title: "Authorization Approved",
        description: "MRI Cervical Spine approved",
        date: "Sep 28, 2024",
        status: "approved",
      },
      {
        id: "TL-005",
        type: "approval",
        title: "Authorization Approved",
        description: "Physical Therapy (12 sessions) approved",
        date: "Sep 15, 2024",
        status: "approved",
      },
      {
        id: "TL-006",
        type: "approval",
        title: "Authorization Approved",
        description: "Epidural Steroid Injection approved",
        date: "Aug 22, 2024",
        status: "approved",
      },
    ],
  };

  const appeals = [
    {
      id: "AP-2024-001",
      requestId: "PA-2024-003",
      procedure: "CT Scan Lumbar",
      status: "pending",
      submittedDate: "Oct 16, 2024",
      successProbability: "84%",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
      pending: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
      denied: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
    };
    return (
      <Badge variant="outline" className={`${styles[status as keyof typeof styles]} text-xs font-normal`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-[#10B981]" />;
      case "pending":
        return <Clock className="w-4 h-4 text-[#F59E0B]" />;
      case "denied":
        return <XCircle className="w-4 h-4 text-[#EF4444]" />;
      default:
        return null;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="w-4 h-4 text-[#10B981]" />;
      case "denial":
        return <XCircle className="w-4 h-4 text-[#EF4444]" />;
      case "appeal":
        return <Shield className="w-4 h-4 text-primary" />;
      case "visit":
        return <Calendar className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const uniqueInsurances = ["all", ...Array.from(new Set(patients.map(p => p.insurance)))];

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.insurance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesInsurance = insuranceFilter === "all" || patient.insurance === insuranceFilter;
    
    return matchesSearch && matchesInsurance;
  });

  // Patient list view
  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-1">Patients</h1>
          <p className="text-sm text-muted-foreground">View patient authorization history and records</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, ID, or insurance..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Insurance Providers</SelectItem>
                  {uniqueInsurances.slice(1).map(insurance => (
                    <SelectItem key={insurance} value={insurance}>
                      {insurance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {filteredPatients.map((patient, index) => (
                <div key={patient.id}>
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{patient.name}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{patient.age}y {patient.gender.charAt(0)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{patient.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.insurance}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-sm font-medium">{patient.totalRequests}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-[#10B981] mb-1">Approved</p>
                        <p className="text-sm font-medium text-[#10B981]">{patient.approved}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-[#F59E0B] mb-1">Pending</p>
                        <p className="text-sm font-medium text-[#F59E0B]">{patient.pending}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-[#EF4444] mb-1">Denied</p>
                        <p className="text-sm font-medium text-[#EF4444]">{patient.denied}</p>
                      </div>

                      <div className="w-24 text-right">
                        <p className="text-xs text-muted-foreground">Last visit</p>
                        <p className="text-xs font-medium">{patient.lastVisit}</p>
                      </div>
                    </div>
                  </button>
                  {index < filteredPatients.length - 1 && <Separator />}
                </div>
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No patients found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Patient detail view
  const patientRequests = authRequests[selectedPatient.id] || [];
  const patientLetters = letters[selectedPatient.id] || [];
  const patientTimeline = timeline[selectedPatient.id] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to patients
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1">{selectedPatient.name}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{selectedPatient.age}y · {selectedPatient.gender}</span>
            <span>·</span>
            <span>DOB: {selectedPatient.dob}</span>
            <span>·</span>
            <span>{selectedPatient.id}</span>
          </div>
        </div>
        <Button onClick={() => onNavigate("new-request")}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Patient Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance:</span>
              <span className="font-medium">{selectedPatient.insurance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member ID:</span>
              <span className="font-medium">{selectedPatient.memberId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium">{selectedPatient.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{selectedPatient.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Visit:</span>
              <span className="font-medium">{selectedPatient.lastVisit}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Clinical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Active Diagnoses:</p>
              <div className="space-y-1">
                {selectedPatient.diagnoses.map((diagnosis, i) => (
                  <p key={i} className="text-xs font-medium">{diagnosis}</p>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-1 flex items-center gap-1">
                <Pill className="w-3 h-3" />
                Current Medications:
              </p>
              <div className="space-y-1">
                {selectedPatient.medications.map((med, i) => (
                  <p key={i} className="text-xs font-medium">{med}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Requests</p>
              <p className="text-2xl font-medium">{selectedPatient.totalRequests}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-[#10B981] mb-1">Approved</p>
              <p className="text-2xl font-medium text-[#10B981]">{selectedPatient.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-[#F59E0B] mb-1">Pending</p>
              <p className="text-2xl font-medium text-[#F59E0B]">{selectedPatient.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-[#EF4444] mb-1">Denied</p>
              <p className="text-2xl font-medium text-[#EF4444]">{selectedPatient.denied}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="authorizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
          <TabsTrigger value="letters">Letters & Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
        </TabsList>

        <TabsContent value="authorizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authorization History</CardTitle>
              <CardDescription>All prior authorization requests for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {patientRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No authorization requests yet</p>
                  <Button variant="outline" className="mt-4" onClick={() => onNavigate("new-request")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {patientRequests.map((request, index) => (
                    <div key={request.id}>
                      <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 mt-1">{getStatusIcon(request.status)}</div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{request.procedure}</p>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">CPT {request.cpt}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{request.id}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Diagnosis: {request.diagnosis}
                            </p>
                          </div>
                          
                          {request.clinicalNotes && (
                            <div className="rounded-md bg-muted/50 p-3 border-l-2 border-primary/20">
                              <p className="text-xs text-muted-foreground">Clinical Notes:</p>
                              <p className="text-xs mt-1">{request.clinicalNotes}</p>
                            </div>
                          )}

                          {request.denialReason && (
                            <div className="rounded-md bg-[#EF4444]/5 p-3 border-l-2 border-[#EF4444]">
                              <p className="text-xs text-[#EF4444] font-medium">
                                Denial Reason: {request.denialReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-right w-28 flex-shrink-0">
                          <p className="text-sm font-medium">{request.amount}</p>
                          <p className="text-xs text-muted-foreground">{request.date}</p>
                        </div>

                        <div className="w-24 text-center flex-shrink-0">{getStatusBadge(request.status)}</div>

                        <div className="w-24 flex-shrink-0">
                          {request.status === "denied" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-full"
                              onClick={() => onNavigate("appeals")}
                            >
                              Appeal
                            </Button>
                          )}
                        </div>
                      </div>
                      {index < patientRequests.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="letters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Letters & Documents</CardTitle>
              <CardDescription>All authorization letters and appeal documents</CardDescription>
            </CardHeader>
            <CardContent>
              {patientLetters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No letters generated yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {patientLetters.map((letter, index) => (
                    <div key={letter.id}>
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            letter.type === "appeal" ? "bg-primary/10" : "bg-muted"
                          }`}>
                            {letter.type === "appeal" ? (
                              <Shield className="w-4 h-4 text-primary" />
                            ) : (
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{letter.procedure}</p>
                            <Badge variant="outline" className="text-xs">
                              {letter.type === "appeal" ? "Appeal Letter" : "Auth Letter"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Request ID: {letter.requestId} · Generated {letter.date}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(letter.status)}
                          <Button variant="outline" size="sm" className="h-7">
                            View Letter
                          </Button>
                        </div>
                      </div>
                      {index < patientLetters.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Chronological history of all patient activity</CardDescription>
            </CardHeader>
            <CardContent>
              {patientTimeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No activity recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientTimeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.status === "approved" ? "bg-[#10B981]/10" :
                          event.status === "denied" ? "bg-[#EF4444]/10" :
                          event.status === "pending" ? "bg-[#F59E0B]/10" :
                          "bg-muted"
                        }`}>
                          {getTimelineIcon(event.type)}
                        </div>
                        {index < patientTimeline.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Appeals</CardTitle>
              <CardDescription>Appeals filed for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {appeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No appeals filed for this patient</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <div key={appeal.id} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{appeal.procedure}</p>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">Appeal {appeal.id}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Original request: {appeal.requestId}
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">
                          {appeal.successProbability} success rate
                        </Badge>
                        <p className="text-xs text-muted-foreground">Submitted {appeal.submittedDate}</p>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => onNavigate("appeals")}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

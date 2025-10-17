import { CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface CasesProps {
  onNavigate: (screen: string) => void;
}

export function Cases({ onNavigate }: CasesProps) {
  const activeCases = [
    {
      id: "PA-2024-002",
      patient: "Mike Rodriguez",
      procedure: "Shoulder Surgery",
      insurance: "Blue Cross Blue Shield",
      status: "pending",
      amount: "$45,000",
      date: "Oct 16, 2024",
      daysOpen: 2,
    },
    {
      id: "PA-2024-006",
      patient: "Jennifer Lee",
      procedure: "Hip MRI",
      insurance: "United Healthcare",
      status: "pending",
      amount: "$4,500",
      date: "Oct 17, 2024",
      daysOpen: 1,
    },
  ];

  const historyItems = [
    {
      id: "PA-2024-001",
      patient: "Sarah Johnson",
      procedure: "MRI Lumbar Spine",
      insurance: "United Healthcare",
      status: "approved",
      amount: "$4,200",
      date: "Oct 15, 2024",
    },
    {
      id: "PA-2024-003",
      patient: "Tom Davidson",
      procedure: "CT Scan",
      insurance: "Aetna",
      status: "denied",
      amount: "$8,500",
      date: "Oct 14, 2024",
    },
    {
      id: "PA-2024-004",
      patient: "Lisa Kim",
      procedure: "Knee MRI",
      insurance: "Cigna",
      status: "approved",
      amount: "$3,800",
      date: "Oct 13, 2024",
    },
    {
      id: "PA-2024-005",
      patient: "Robert Chen",
      procedure: "Spinal Injection",
      insurance: "Medicare",
      status: "approved",
      amount: "$2,100",
      date: "Oct 12, 2024",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1">My Cases</h1>
        <p className="text-sm text-muted-foreground">View and manage all authorization requests</p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search cases..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {activeCases.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

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

                      <div className="w-24 text-center">{getStatusBadge(item.status)}</div>

                      <div className="w-20 text-right">
                        <p className="text-xs text-muted-foreground">{item.daysOpen}d open</p>
                      </div>

                      <div className="w-20">
                        {/* Reserved space for actions */}
                      </div>
                    </div>
                    {index < activeCases.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search history..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {historyItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

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

                      <div className="w-24 text-center">{getStatusBadge(item.status)}</div>

                      <div className="w-20 text-right">
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>

                      <div className="w-20">
                        {item.status === "denied" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => onNavigate("appeals")}
                          >
                            Appeal
                          </Button>
                        )}
                      </div>
                    </div>
                    {index < historyItems.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

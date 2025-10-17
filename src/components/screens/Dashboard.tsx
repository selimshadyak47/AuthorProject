import { CheckCircle, Clock, XCircle, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    {
      icon: CheckCircle,
      label: "Approved",
      count: "8",
      amount: "$67,400",
      color: "text-[#10B981]",
      bgColor: "bg-[#10B981]/5",
      borderColor: "border-[#10B981]/10",
    },
    {
      icon: Clock,
      label: "Pending",
      count: "2",
      amount: "$18,200",
      color: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/5",
      borderColor: "border-[#F59E0B]/10",
    },
    {
      icon: XCircle,
      label: "Denied",
      count: "1",
      amount: "$8,500",
      color: "text-[#EF4444]",
      bgColor: "bg-[#EF4444]/5",
      borderColor: "border-[#EF4444]/10",
    },
  ];

  const activities = [
    {
      status: "Approved",
      patient: "Sarah Johnson",
      procedure: "MRI Lumbar Spine",
      amount: "$4,200",
      date: "2 hours ago",
      type: "success",
    },
    {
      status: "Pending Review",
      patient: "Mike Rodriguez",
      procedure: "Shoulder Surgery",
      amount: "$45,000",
      date: "5 hours ago",
      type: "pending",
    },
    {
      status: "Denied",
      patient: "Tom Davidson",
      procedure: "CT Scan",
      amount: "$8,500",
      date: "Yesterday",
      type: "denied",
    },
    {
      status: "Appeal Won",
      patient: "Lisa Kim",
      procedure: "Knee MRI",
      amount: "$12,300",
      date: "2 days ago",
      type: "success",
    },
  ];

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "success":
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
        <h1 className="mb-1">Home</h1>
        <p className="text-sm text-muted-foreground">Overview of your authorization activity</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => {
          const navMap: Record<string, string> = {
            "Approved": "cases",
            "Pending": "cases",
            "Denied": "appeals"
          };
          
          return (
            <Card 
              key={stat.label} 
              className={`border ${stat.borderColor} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onNavigate(navMap[stat.label])}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`text-2xl ${stat.color}`}>{stat.count}</div>
                    <p className="text-sm text-muted-foreground">{stat.amount} total value</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full h-8 mt-2">
                    View {stat.label}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest authorization requests and appeals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activities.map((activity, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between py-4 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{activity.patient}</span>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.procedure}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium w-20 text-right">{activity.amount}</span>
                      <div className="w-16">
                        {activity.type === "denied" && (
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
                  </div>
                  {i < activities.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={() => onNavigate("new-request")}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate("appeals")}>
                View Denied Cases
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate("cases")}>
                View All Cases
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time Saved This Week</p>
                  <p className="text-xl text-primary">18.5 hours</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                  <p className="text-xl text-[#10B981]">84%</p>
                  <p className="text-xs text-muted-foreground">Industry avg: 30%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

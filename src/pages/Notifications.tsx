import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { toast } = useToast();

  const notifications = [
    {
      id: 1,
      type: "Error",
      title: "Vendor Import Failed",
      message: "Green Valley Producers report contains 5 unmatched patient records",
      timestamp: "2 hours ago",
      read: false,
      priority: "High",
      action: "Review Exceptions",
    },
    {
      id: 2,
      type: "Warning",
      title: "Non-Ordering Veterans Alert",
      message: "15 veterans have not ordered for 2+ consecutive months",
      timestamp: "4 hours ago",
      read: false,
      priority: "Medium",
      action: "View Report",
    },
    {
      id: 3,
      type: "Success",
      title: "Monthly Upload Complete",
      message: "Downtown Medical Center patient data successfully imported (1,247 records)",
      timestamp: "6 hours ago",
      read: true,
      priority: "Low",
      action: null,
    },
    {
      id: 4,
      type: "Warning",
      title: "Missing Vendor Report",
      message: "Westside Cannabis Clinic has not submitted November report",
      timestamp: "1 day ago",
      read: false,
      priority: "Medium",
      action: "Contact Vendor",
    },
    {
      id: 5,
      type: "Info",
      title: "Scheduled Report Generated",
      message: "Weekly reconciliation report has been generated and is ready for download",
      timestamp: "2 days ago", 
      read: true,
      priority: "Low",
      action: "Download",
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Error': return AlertTriangle;
      case 'Warning': return AlertTriangle;
      case 'Success': return CheckCircle;
      case 'Info': return Bell;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'Error': return 'text-destructive';
      case 'Warning': return 'text-warning';
      case 'Success': return 'text-success';
      case 'Info': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    toast({
      title: "Notification Updated",
      description: "Notification marked as read",
    });
  };

  const handleDismiss = (notificationId: number) => {
    toast({
      title: "Notification Dismissed",
      description: "Notification has been removed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">System alerts and important updates</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {notifications.filter(n => n.priority === 'High' && !n.read).length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Import Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {notifications.filter(n => n.type === 'Error').length}
            </div>
            <p className="text-xs text-muted-foreground">Need resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Alerts</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {notifications.filter(n => n.timestamp.includes('hour')).length}
            </div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            All Notifications
          </CardTitle>
          <CardDescription>Recent system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-muted/30 border-border' 
                      : 'bg-card border-primary/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(notification.type)}`} />
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.title}
                          </h3>
                          <Badge variant={getBadgeVariant(notification.priority) as any} className="text-xs">
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        
                        <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                          
                          <div className="flex items-center gap-2">
                            {notification.action && (
                              <Button variant="outline" size="sm">
                                {notification.action}
                              </Button>
                            )}
                            
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDismiss(notification.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure when and how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Import Failures</p>
                <p className="text-sm text-muted-foreground">Alert when vendor imports fail</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Non-Ordering Patients</p>
                <p className="text-sm text-muted-foreground">Weekly alerts for inactive patients</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Missing Reports</p>
                <p className="text-sm text-muted-foreground">Daily check for overdue vendor reports</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">System Updates</p>
                <p className="text-sm text-muted-foreground">Notifications for system maintenance</p>
              </div>
              <Badge variant="secondary">Disabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
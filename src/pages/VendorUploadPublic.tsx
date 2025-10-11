import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VendorUploadPublic() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Vendor Report (Preview)</h1>
          <p className="text-muted-foreground">Public preview without database/auth. Use this to confirm the page renders.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demo Form</CardTitle>
            <CardDescription>This is a non-functional preview. Sign in to use the real uploader.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input placeholder="Choose vendor" disabled />
              </div>
              <div className="space-y-2">
                <Label>Report Month</Label>
                <Input type="month" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Excel File</Label>
              <Input type="file" accept=".xlsx,.xls" disabled />
            </div>
            <Button className="w-full" disabled>Upload Report</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>Go to login to enable the full uploader.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/auth"><Button>Go to Login</Button></a>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

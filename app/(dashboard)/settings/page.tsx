import { User, Bell, Shield, Palette } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SettingsPage() {
  const user = await currentUser();

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and application preferences
        </p>
      </div>

      {/* Implementation Tasks Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          ⚙️ Settings Implementation Tasks
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Task 2.4: Implement user session management</li>
          <li>• Task 6.4: Implement project member management and permissions</li>
        </ul>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <nav className="space-y-2">
              {[
                { name: "Profile", icon: User, active: true },
                { name: "Notifications", icon: Bell, active: false },
                { name: "Security", icon: Shield, active: false },
                { name: "Appearance", icon: Palette, active: false },
              ].map((item) => (
                <button
                  key={item.name}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? "bg-primary/15 dark:bg-primary/25 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="mr-3" size={16} />
                  {item.name}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <Input
                type="text"
                defaultValue={fullName}
                className="border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                defaultValue={email}
                className="border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Role</label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Project Manager</option>
                <option>Developer</option>
                <option>Designer</option>
                <option>QA Engineer</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="ghost" className="rounded-lg text-muted-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button className="rounded-lg">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { DashboardHeader } from '@/components/app/DashboardHeader';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Manage your account settings and set e-mail preferences."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Max Robinson" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="m@example.com" />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button>Save</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what you want to be notified about.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="mentions" defaultChecked />
              <label
                htmlFor="mentions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mentions & Comments
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="weekly-report" />
              <label
                htmlFor="weekly-report"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Weekly Performance Reports
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="promotions" defaultChecked />
              <label
                htmlFor="promotions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Product Updates & Promotions
              </label>
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

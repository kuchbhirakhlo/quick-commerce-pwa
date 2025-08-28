"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MapPin,
  Settings,
  User,
  Store,
  CreditCard,
  Bell,
  Shield,
  FileText,
  ChevronRight
} from "lucide-react"

export default function AdminSettingsPage() {
  const settingsItems = [
    {
      title: "Delivery Areas",
      description: "Manage pincodes where vendors can deliver products",
      icon: <MapPin className="h-6 w-6" />,
      href: "/admin/settings/pincodes",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
    {
      title: "Account Settings",
      description: "Manage your account details and preferences",
      icon: <User className="h-6 w-6" />,
      href: "/admin/settings/account",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Store Settings",
      description: "Configure marketplace appearance and behavior",
      icon: <Store className="h-6 w-6" />,
      href: "/admin/settings/store",
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Payment Methods",
      description: "Manage payment gateways and options",
      icon: <CreditCard className="h-6 w-6" />,
      href: "/admin/settings/payments",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Notifications",
      description: "Configure email and push notification settings",
      icon: <Bell className="h-6 w-6" />,
      href: "/admin/settings/notifications",
      color: "text-yellow-500",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Security",
      description: "Manage security settings and permissions",
      icon: <Shield className="h-6 w-6" />,
      href: "/admin/settings/security",
      color: "text-red-500",
      bgColor: "bg-red-100",
    },
    {
      title: "Legal Documents",
      description: "Update terms of service and privacy policy",
      icon: <FileText className="h-6 w-6" />,
      href: "/admin/settings/legal",
      color: "text-gray-500",
      bgColor: "bg-gray-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`${item.bgColor} ${item.color} p-3 rounded-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
} 
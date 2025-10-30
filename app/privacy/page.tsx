"use client";
import React from "react";
import Header from "@/components/header";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="mb-4">At buzzat.in, we are committed to protecting your privacy. We only collect necessary information to provide our services and never share your personal data except as required by law or to provide order fulfillment.</p>
                <ul className="list-disc ml-6 mb-4">
                    <li>We use cookies and analytics to improve user experience.</li>
                    <li>Your contact info is used only for service or transactional updates.</li>
                    <li>We don't sell your data to third parties.</li>
                    <li>For account deletion or data requests, contact support@buzzat.in.</li>
                </ul>
                <p className="mb-4">Read the policy in detail at any time. We may update it occasionally and notify users appropriately.</p>
            </div>
        </main>
    );
}

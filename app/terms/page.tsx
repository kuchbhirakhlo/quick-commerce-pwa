"use client";
import React from "react";
import Header from "@/components/header";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-8">
                <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
                <p className="mb-4">These Terms & Conditions govern your use of buzzat.in. By using our platform, you agree to comply with them. We reserve the right to update or change terms at any time.</p>
                <ul className="list-disc ml-6 mb-4">
                    <li>Use buzzat.in for lawful purposes only.</li>
                    <li>Respect trademarks, copyright, and intellectual property.</li>
                    <li>Orders may be subject to verification, availability, and area restrictions.</li>
                    <li>For support, always use official buzzat.in channels.</li>
                </ul>
                <p className="mb-4">Contact us with any questions at support@buzzat.in.</p>
            </div>
        </main>
    );
}

"use client";
import React from "react";
import Header from "@/components/header";

export default function FAQsPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-8">
                <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1> and
                <div className="mb-4">
                    <h2 className="font-semibold mb-2">Q: What is buzzat.in?</h2>
                    <p className="mb-2">A: buzzat.in is a quick commerce platform connecting vendors and customers for fast, convenient shopping and delivery.</p>
                    <h2 className="font-semibold mb-2">Q: How do I contact support?</h2>
                    <p className="mb-2">A: Email us at <a href="mailto:support@buzzat.in" className="text-blue-500 underline">support@buzzat.in</a> or use our contact page.</p>
                    <h2 className="font-semibold mb-2">Q: Is my information safe?</h2>
                    <p className="mb-2">A: Yes, please see our Privacy Policy for details on how we protect your data.</p>
                    <h2 className="font-semibold mb-2">Q: Can I order from any location?</h2>
                    <p className="mb-2">A: Service areas may vary. Check your pincode at checkout to confirm availability.</p>
                </div>
            </div>
        </main>
    );
}

"use client";
import React from "react";
import Header from "@/components/header";

export default function ContactUsPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-8">
                <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
                <p className="mb-4">For questions, support, or feedback about buzzat.in, please email us at <a href="mailto:support@buzzat.in" className="text-blue-500 underline">support@buzzat.in</a> or fill out the form below:</p>
                <form className="space-y-4 max-w-lg">
                    <input className="border rounded px-3 py-2 w-full" type="text" placeholder="Your Name" required />
                    <input className="border rounded px-3 py-2 w-full" type="email" placeholder="Your Email" required />
                    <textarea className="border rounded px-3 py-2 w-full" placeholder="How can we help you?" rows={4} required />
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded">Send</button>
                </form>
            </div>
        </main>
    );
}

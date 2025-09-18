"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <img
                    src="https://res-console.cloudinary.com/dwfctknuj/thumbnails/v1/image/upload/v1756381182/cXVpY2stY29tbWVyY2UvcHJvZHVjdHMvY2F0ZWdvcmllcy8xNzU2MzgxMTgyNDU3X3BuZ3RyZWUtcGl6emEtc2xpY2UtcG5nLWltYWdlXzE1MzQwNzIzLnBuZw==/drilldown"
                    alt="Lost in the grocery aisle"
                    className="mx-auto h-48 w-48 rounded-full object-cover shadow-lg mb-4"
                />
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-4xl font-bold text-green-600 mb-2">Looking for the Pizzaaas?</CardTitle>
                        <CardDescription className="text-lg text-gray-600">
                            Don't worry, we've got plenty of fresh fast food to explore!

                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-sm text-gray-500 mb-6">
                            The page you're looking for is out of stock. Let's get you back to shopping!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/">
                                <Button variant="default" className="w-full sm:w-auto">
                                    Go Home
                                </Button>
                            </Link>
                            <Link href="/category">
                                <Button variant="outline" className="w-full sm:w-auto">
                                    Browse Categories
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
import { Suspense } from "react"
import { ProductDetail } from "@/components/product-detail"
import { Loader2 } from "lucide-react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductById } from "@/lib/firebase/firestore"
import Header from "@/components/header"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    return {
      title: "Product Not Found | Quick Commerce",
      description: "The product you are looking for does not exist."
    }
  }

  return {
    title: `${product.name} | Quick Commerce`,
    description: product.description || `Buy ${product.name} online at Quick Commerce`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const productData = await getProductById(id)

  if (!productData) {
    notFound()
  }

  const product = {
    ...productData,
    createdAt: productData.createdAt ? productData.createdAt.toDate().toISOString() : null,
    updatedAt: productData.updatedAt ? productData.updatedAt.toDate().toISOString() : null,
    id: productData.id ?? id,
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Suspense fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
          </div>
        }>
          <ProductDetail product={product} />
        </Suspense>
      </div>
    </main>
  )
} 
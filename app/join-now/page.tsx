"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";

export default function JoinVendorHindi() {
    const whatsappNumber = "83838811977";
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=नमस्ते%20Buzzat%20Team!%20मैं%20आपके%20प्लेटफ़ॉर्म%20पर%20वेंडर%20बनना%20चाहता%20हूं।`;

    return (
        <div className="flex flex-col items-center bg-white text-gray-800">
            {/* Hero Section */}
            <section className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 py-16 px-6 text-center text-white">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-5xl font-bold mb-4"
                >
                    Buzzat.in के साथ अपना स्टोर ऑनलाइन लाएं 🚀
                </motion.h1>
                <p className="text-lg md:text-xl max-w-2xl mx-auto">
                    अपने आसपास के ग्राहकों तक पहुंचें, आसानी से ऑर्डर मैनेज करें और तुरंत पेमेंट पाएं — वो भी अपने मोबाइल से।
                </p>
                <div className="mt-6">
                    <a href={whatsappLink} target="_blank">
                        <Button className="bg-green-500 hover:bg-green-600 text-white text-lg rounded-full px-6 py-3 flex items-center gap-2 mx-auto">
                            <FaWhatsapp size={20} /> अपना बिज़नेस शुरू करें
                        </Button>
                    </a>
                </div>
            </section>

            {/* Section 1 */}
            <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-4 text-orange-500">
                        Buzzat Vendor Platform क्यों जॉइन करें?
                    </h2>
                    <p className="mb-4">
                        Buzzat.in आपके जैसे लोकल दुकानदारों को ग्राहकों से सीधे जोड़ता है — Blinkit और Zepto की तरह, लेकिन ज्यादा कंट्रोल आपके हाथों में।
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>📱 अपने मोबाइल ऐप से पूरा स्टोर मैनेज करें</li>
                        <li>🔔 रियल टाइम ऑर्डर नोटिफिकेशन ध्वनि के साथ पाएं</li>
                        <li>🚚 खुद डिलीवरी करें और पूरी डिलीवरी फ़ीस अपने पास रखें</li>
                        <li>🕒 स्टोर खोलने और बंद करने का समय खुद सेट करें</li>
                        <li>🛍️ कई कैटेगरी और असीमित प्रोडक्ट जोड़ें</li>
                    </ul>
                    <div className="mt-6">
                        <a href={whatsappLink} target="_blank">
                            <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center gap-2">
                                <FaWhatsapp /> व्हाट्सएप पर संपर्क करें
                            </Button>
                        </a>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Image
                        src="/vendor-dashboard.png"
                        alt="Vendor Dashboard"
                        width={500}
                        height={400}
                        className="rounded-2xl shadow-lg"
                    />
                </div>
            </section>

            {/* Section 2 */}
            <section className="bg-gray-50 py-16 px-6 w-full">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
                    <div className="flex justify-center order-2 md:order-1">
                        <Image
                            src="/vendor-timing.jpg"
                            alt="Store Timing"
                            width={500}
                            height={400}
                            className="rounded-2xl shadow-lg"
                        />
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-3xl font-bold mb-4 text-orange-500">
                            अपने स्टोर पर पूरा कंट्रोल रखें
                        </h2>
                        <p className="mb-4">
                            आप आसानी से तय कर सकते हैं कि आपका स्टोर कब खुला या बंद रहे। जब चाहें प्रोडक्ट जोड़ें या हटाएं — सब कुछ आपके नियंत्रण में।
                        </p>
                        <p>
                            अपने व्यवसाय को डिजिटल बनाएं और ग्राहकों से सीधे जुड़ें।
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 3 */}
            <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-10 items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-4 text-orange-500">
                        खुद डिलीवरी करें, ज्यादा कमाई पाएं
                    </h2>
                    <p className="mb-4">
                        आप अपने ऑर्डर खुद डिलीवर कर सकते हैं और पूरी डिलीवरी राशि अपने पास रख सकते हैं। इससे ग्राहक भरोसेमंद अनुभव पाते हैं।
                    </p>
                    <p>
                        हर नए ऑर्डर की सूचना आपको तुरंत मिलेगी, और पेमेंट सीधे आपके अकाउंट में जाएगा।
                    </p>
                    <div className="mt-6">
                        <a href={whatsappLink} target="_blank">
                            <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center gap-2">
                                <FaWhatsapp /> Buzzat Vendor बनें
                            </Button>
                        </a>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Image
                        src="/vendor-delivery.jpg"
                        alt="Delivery Partner"
                        width={500}
                        height={400}
                        className="rounded-2xl shadow-lg"
                    />
                </div>
            </section>

            {/* Section 4 */}
            <section className="bg-yellow-50 py-16 px-6 text-center">
                <h2 className="text-3xl font-bold mb-4 text-orange-500">
                    Vendor Access और Login
                </h2>
                <p className="max-w-3xl mx-auto mb-6">
                    Vendor अकाउंट Buzzat Admin द्वारा बनाए और एक्टिव किए जाते हैं।
                    एक्सेस मिलने के बाद आप{" "}
                    <a href="https://buzzat.in/vendor" className="text-blue-600 font-semibold underline">
                        buzzat.in/vendor
                    </a>{" "}
                    पर लॉगिन करके तुरंत अपना स्टोर मैनेज कर सकते हैं।
                </p>
                <a href={whatsappLink} target="_blank">
                    <Button className="bg-green-500 hover:bg-green-600 text-white text-lg rounded-full px-6 py-3 flex items-center gap-2 mx-auto">
                        <FaWhatsapp size={20} /> Vendor Access पाएं
                    </Button>
                </a>
            </section>

            {/* Footer */}
            <footer className="py-10 text-center text-gray-600 text-sm">
                © {new Date().getFullYear()} Buzzat.in — स्थानीय दुकानों को डिजिटल बना रहा है
            </footer>
        </div>
    );
}

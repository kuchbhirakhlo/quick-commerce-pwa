import { useState, useEffect } from 'react';
import qrcode from 'qrcode';

interface UPIPaymentProps {
    amount: number;
}

const UPIPayment: React.FC<UPIPaymentProps> = ({ amount }) => {
    const [qrCode, setQrCode] = useState<string>('');

    const upiLink = `upi://pay?pa=${encodeURIComponent('paytm.s1fdroi@pty')}&pn=${encodeURIComponent('Buzzat Store')}&am=${amount}&tn=${encodeURIComponent('Buzzat Store Online Payment')}&cu=INR`;

    useEffect(() => {
        const generateQR = async () => {
            try {
                const QRCode = await qrcode.toDataURL(upiLink);
                setQrCode(QRCode);
            } catch (err) {
                console.error(err);
            }
        };
        generateQR();
    }, [amount]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Pay ₹{amount}</h3>
            {qrCode && (
                <div className="flex flex-col items-center">
                    <img src={qrCode} alt="UPI QR Code" className="w-48 h-48 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">Scan QR code with any UPI app</p>
                </div>
            )}
            <a
                href={upiLink}
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white text-center py-2 px-4 rounded-md transition-colors"
            >
                Pay via UPI App
            </a>
        </div>
    );
};

export default UPIPayment;
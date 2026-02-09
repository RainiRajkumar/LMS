import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generatePaymentReceipt({
  studentName,
  courseTitle,
  amount,
  paymentMethod,
  transactionId,
  paidOn,
  enrollmentId,
  courseId
}) {
  const doc = new jsPDF();

  // Helper to convert image URL to base64
  function toDataURL(url) {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function () { reject(); };
      img.src = url;
    });
  }

  async function buildPDF() {
    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.text("LMS", 105, 120, { align: "center", angle: 30 });

    // Logo (replace with your logo URL)
    const logoUrl = process.env.PUBLIC_URL + "/logo.jpg"; // Use public URL for React app
    try {
      const logoBase64 = await toDataURL(logoUrl);
      doc.addImage(logoBase64, 'JPG', 14, 12, 20, 20);
    } catch (error) {
      console.warn("Logo could not be loaded, proceeding without logo:", error);
      // Continue without logo
    }

    // Interactive Header
    doc.setFillColor(67, 97, 238);
    doc.roundedRect(10, 10, 190, 25, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("EduPro Academy", 40, 27);
    doc.setFontSize(13);
    doc.text("Official Payment Receipt", 170, 27, { align: "right" });

    // Receipt Info Section
    doc.setTextColor(67, 97, 238);
    doc.setFontSize(12);
    doc.roundedRect(10, 40, 190, 18, 6, 6);
    doc.text(`Date: ${paidOn}`, 20, 52);
    doc.text(`Receipt #: ${transactionId}`, 170, 52, { align: "right" });

    // Student & Course Info Section
    autoTable(doc, {
      startY: 62,
      head: [["Student Name", "Course Title", "Enrollment ID", "Course ID"]],
      body: [[studentName, courseTitle, enrollmentId, courseId]],
      theme: 'grid',
      headStyles: { fillColor: [67, 97, 238], textColor: 255 },
      styles: { fontSize: 11, cellPadding: 3, halign: 'center' },
      tableLineColor: [76, 201, 240],
      tableLineWidth: 0.5
    });

   // 6. Payment Details Section (FIXED PORTION)
    let cleanAmount = amount;
    // Ensure amount is handled correctly even if it comes as a string with a symbol
    if (typeof amount === 'string') {
        cleanAmount = amount.replace(/[₹,]/g, '').trim(); 
    }
    
    // Convert to number and format to 2 decimal places
    const formattedAmountNum = parseFloat(cleanAmount).toFixed(2);
    
    // IMPORTANT: Use "Rs." because standard PDF fonts cannot render the "₹" symbol
    const amountStr = `Rs. ${formattedAmountNum}`;

    console.log("PDF Value Check:", amountStr); // Will log "Rs. 500.00"


    console.log("Formatted amount:/n", amountStr);
    console.log("Payment method:", paymentMethod);
    console.log("Transaction ID:", transactionId);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Amount Paid", "Payment Method"]],
      body: [[amountStr, paymentMethod]],
      theme: 'grid',
      headStyles: { fillColor: [76, 201, 240], textColor: 0 },
      styles: { fontSize: 13, fontStyle: 'bold', cellPadding: 4, halign: 'center' },
      tableLineColor: [67, 97, 238],
      tableLineWidth: 0.5
    });

    console.log("Amount string after table generation:", amountStr);
    // QR Code for transaction (using Google Chart API)
    const qrUrl = `https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${transactionId}`;
    try {
      const qrBase64 = await toDataURL(qrUrl);
      doc.setFontSize(11);
      doc.setTextColor(67, 97, 238);
      doc.text("Scan for transaction verification:", 20, doc.lastAutoTable.finalY + 28);
      doc.addImage(qrBase64, 'PNG', 20, doc.lastAutoTable.finalY + 30, 30, 30);
    } catch (error) {
      console.warn("QR code could not be loaded, proceeding without QR code:", error);
      // Continue without QR code
    }

    // Contact Info Section
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Contact: support@edupro.com | +91-9876543210", 105, doc.internal.pageSize.height - 24, { align: "center" });

    // Footer/Thank you
    doc.setFontSize(11);
    doc.setTextColor(67, 97, 238);
    doc.text("Thank you for your payment!", 105, doc.internal.pageSize.height - 16, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text("This is a computer generated receipt and does not require a signature.", 105, doc.internal.pageSize.height - 10, { align: "center" });

    doc.save(`Payment_Receipt_${transactionId}.pdf`);
  }

  await buildPDF();
}

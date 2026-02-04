// Email Service for sending student reports
// Uses EmailJS for client-side email sending

import type { SendReportEmailRequest, StudentReportConfig } from '../types/student-report';

// EmailJS init script URL
const EMAILJS_SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

// Load EmailJS SDK dynamically
let emailJSLoaded = false;

async function loadEmailJS(): Promise<void> {
  if (emailJSLoaded) return;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof (window as unknown as { emailjs: unknown }).emailjs !== 'undefined') {
      emailJSLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = EMAILJS_SDK_URL;
    script.async = true;
    script.onload = () => {
      emailJSLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
    document.head.appendChild(script);
  });
}

// EmailJS interface
interface EmailJSResponse {
  status: number;
  text: string;
}

interface EmailJSInstance {
  init: (options: { publicKey: string }) => void;
  send: (serviceId: string, templateId: string, params: Record<string, string>) => Promise<EmailJSResponse>;
}

// Get EmailJS instance
function getEmailJS(): EmailJSInstance | null {
  return (window as unknown as { emailjs: EmailJSInstance }).emailjs || null;
}

// Send student report email
export async function sendReportEmail(
  request: SendReportEmailRequest,
  config: StudentReportConfig
): Promise<{ success: boolean; message: string }> {
  // Validate config
  if (!config.emailServiceId || !config.emailTemplateId || !config.emailPublicKey) {
    return {
      success: false,
      message: 'Chua cau hinh thong tin EmailJS. Vui long vao Cai dat de thiet lap.',
    };
  }

  try {
    // Load EmailJS SDK
    await loadEmailJS();

    const emailjs = getEmailJS();
    if (!emailjs) {
      return {
        success: false,
        message: 'Khong the tai EmailJS SDK.',
      };
    }

    // Initialize EmailJS
    emailjs.init({ publicKey: config.emailPublicKey });

    // Prepare email params
    const templateParams: Record<string, string> = {
      to_email: request.recipientEmail,
      to_name: request.recipientName,
      from_name: request.senderName,
      school_name: request.schoolName,
      report_period: request.reportPeriod,
      message: request.message || `Gui quy phu huynh bao cao hoc tap cua hoc vien ${request.recipientName}.`,
    };

    // Add PDF URL if available
    if (request.pdfUrl) {
      templateParams.pdf_url = request.pdfUrl;
    }

    // Note: EmailJS doesn't support direct file attachments in free tier
    // For attachments, the PDF URL should be included in the template

    // Send email
    const response = await emailjs.send(
      config.emailServiceId,
      config.emailTemplateId,
      templateParams
    );

    if (response.status === 200) {
      return {
        success: true,
        message: 'Email da duoc gui thanh cong!',
      };
    } else {
      return {
        success: false,
        message: `Loi gui email: ${response.text}`,
      };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Loi khong xac dinh khi gui email.',
    };
  }
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send batch reports to multiple recipients
export async function sendBatchReportEmails(
  requests: SendReportEmailRequest[],
  config: StudentReportConfig,
  onProgress?: (sent: number, total: number, current: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];

    onProgress?.(i, requests.length, request.recipientName);

    const result = await sendReportEmail(request, config);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${request.recipientName}: ${result.message}`);
    }

    // Add delay between emails to avoid rate limiting
    if (i < requests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  onProgress?.(requests.length, requests.length, 'Hoan thanh');

  return results;
}

// EmailJS template example for reference
export const EMAIL_TEMPLATE_EXAMPLE = `
Subject: [{{school_name}}] Bao cao hoc tap - {{to_name}}

Dear {{to_name}},

{{message}}

Thoi gian ky hoc: {{report_period}}

Vui long tai bao cao tai day: {{pdf_url}}

Than men,
{{from_name}}
{{school_name}}
`;

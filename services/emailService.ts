
import { db } from '../db';

export const EMAIL_TEMPLATES = {
  REGISTRATION_CONFIRMATION: (name: string) => ({
    subject: "HealthDost | Application Received - Dr. " + name,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0d9488; padding: 30px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to the Network</h1>
        </div>
        <div style="padding: 30px; line-height: 1.6; color: #334155;">
          <p>Dear Dr. ${name},</p>
          <p>Thank you for registering with <strong>HealthDost Rural Network</strong>. We have received your application and clinical credentials.</p>
          <p><strong>What happens next?</strong></p>
          <ul style="padding-left: 20px;">
            <li>Our Medical Board will verify your MCI/State Council registration number.</li>
            <li>Your uploaded documents (Degree, ID Proof) will undergo an integrity check.</li>
            <li>Verification typically takes <strong>24 to 48 hours</strong>.</li>
          </ul>
          <p>You can check your real-time status on our portal using your registered email.</p>
          <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8;">
            HealthDost Medical Board Team <br/>
            Ministry of Digital Health Initiative
          </div>
        </div>
      </div>
    `
  }),
  VERIFICATION_APPROVED: (name: string) => ({
    subject: "HealthDost | Credentials Verified - Account Activated",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #10b981; padding: 30px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Verification Successful!</h1>
        </div>
        <div style="padding: 30px; line-height: 1.6; color: #334155;">
          <p>Congratulations Dr. ${name},</p>
          <p>Your professional credentials have been verified by our medical board. Your account is now <strong>Active</strong> and visible in the specialist directory.</p>
          <p><strong>Next Steps:</strong></p>
          <ol style="padding-left: 20px;">
            <li>Login to the <a href="#/login/doctor" style="color: #10b981; font-weight: bold; text-decoration: none;">Physician Hub</a>.</li>
            <li>Review your consultation hours and availability.</li>
            <li>Wait for kiosk agents to match you with patients.</li>
          </ol>
          <p>Welcome to India's largest rural health initiative.</p>
          <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8;">
            Authorized by: Chief Medical Officer, HealthDost
          </div>
        </div>
      </div>
    `
  }),
  VERIFICATION_REJECTED: (name: string, reason: string) => ({
    subject: "HealthDost | Action Required: Application Status Update",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #f43f5e; padding: 30px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Update Required</h1>
        </div>
        <div style="padding: 30px; line-height: 1.6; color: #334155;">
          <p>Dear Dr. ${name},</p>
          <p>Our board has reviewed your application and found that some details require correction before we can proceed with activation.</p>
          <div style="background: #fff1f2; padding: 20px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 20px 0;">
            <strong>Reason for Rejection:</strong><br/>
            ${reason}
          </div>
          <p><strong>How to fix this:</strong></p>
          <p>Please re-login to the registration portal and re-upload the relevant documents or correct your registration details. Once submitted, your profile will enter the review queue again.</p>
          <p>Need help? Reply to this email or contact support at helpdesk@healthdost.in</p>
        </div>
      </div>
    `
  }),
  DOCUMENT_REMINDER: (name: string, missingDocs: string[]) => ({
    subject: "HealthDost | Missing Documents - Action Required",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b82f6; padding: 30px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Reminder: Complete your Profile</h1>
        </div>
        <div style="padding: 30px; line-height: 1.6; color: #334155;">
          <p>Hello Dr. ${name},</p>
          <p>Our team noticed that your registration is incomplete. To proceed with the verification, please upload the following documents:</p>
          <ul style="color: #2563eb; font-weight: bold;">
            ${missingDocs.map(doc => `<li>${doc}</li>`).join('')}
          </ul>
          <p>Complete applications are prioritized and usually verified within 24 hours.</p>
          <p><a href="#/register/doctor" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Complete Uploads Now</a></p>
        </div>
      </div>
    `
  })
};

export const sendSimulatedEmail = async (to: string, template: { subject: string, body: string }) => {
  console.log(`[SIMULATED EMAIL SENT] TO: ${to} | SUBJECT: ${template.subject}`);
  
  // Persist to DB for "Simulated Inbox" feature
  const notifications = JSON.parse(localStorage.getItem('rhh_notifications') || '[]');
  notifications.unshift({
    id: Math.random().toString(36).substr(2, 9),
    to,
    subject: template.subject,
    body: template.body,
    timestamp: new Date().toISOString(),
    read: false
  });
  localStorage.setItem('rhh_notifications', JSON.stringify(notifications));
  
  return { success: true };
};

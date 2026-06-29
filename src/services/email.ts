import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_EMAIL = process.env.RESEND_FROM || 'HomeSphere <no-reply@homesphere.co.ke>';

export const sendVerificationEmail = async (email: string, otp: string) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your HomeSphere Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0A3D31; text-align: center;">Welcome to HomeSphere!</h2>
          <p style="color: #333; font-size: 16px;">
            Thank you for registering. Please use the following 6-digit code to verify your email address. This code will expire in 15 minutes.
          </p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <strong style="font-size: 24px; letter-spacing: 5px; color: #D4AF37;">${otp}</strong>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Could not send verification email');
  }
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your HomeSphere Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0A3D31; text-align: center;">Password Reset Request</h2>
          <p style="color: #333; font-size: 16px;">
            We received a request to reset your password. Use the code below to securely reset it. This code expires in 15 minutes.
          </p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <strong style="font-size: 24px; letter-spacing: 5px; color: #D4AF37;">${otp}</strong>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            If you did not request a password reset, please ignore this email to keep your account secure.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Could not send password reset email');
  }
};

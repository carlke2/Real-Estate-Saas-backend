import crypto from 'crypto';

export const generateOTP = (length: number = 6): string => {
  // Generate a random numeric string
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

export const getExpiryDate = (minutesToAdd: number = 15): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date;
};

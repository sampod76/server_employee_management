import { z } from 'zod';

const loginZodSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'email is required',
    }),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: 'Refresh Token is required',
    }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: 'Old password  is required',
    }),
    newPassword: z.string({
      required_error: 'New password  is required',
    }),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string({
      required_error: 'email is required ',
    }),
  }),
});
const checkOtp = z.object({
  body: z.object({
    email: z.string({
      required_error: 'email is required ',
    }),
    otp: z.string({
      required_error: 'otp is required ',
    }),
  }),
});

const tokenToSetPassword = z.object({
  body: z.object({
    resetPasswordToken: z.string({
      required_error: 'Token is required ',
    }),
    newPassword: z.string({
      required_error: 'Password is required ',
    }),
  }),
});

export const AuthValidation = {
  loginZodSchema,
  refreshTokenZodSchema,
  changePasswordZodSchema,
  forgotPassword,
  checkOtp,
  tokenToSetPassword,
};

export const runtime = "nodejs";
import argon2 from "argon2";
import { logger } from "@/lib/logger";
import { sendMailgunEmail } from "@/lib/mailgun";
import { generateRandomToken } from "@/lib/utils";
import { addHours } from "date-fns";
import type { Prisma } from "@prisma/client";
import { userRepository } from '../repositories/userRepository';

export interface CreateUserOptions {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN" | "COMMENTER";
  username?: string;
  bio?: string;
  requireEmailVerification?: boolean;
  sendWelcomeEmail?: boolean;
  ip?: string;
}

export async function createUser({
  name,
  email,
  password,
  role = "USER",
  username,
  bio,
  requireEmailVerification = false,
  sendWelcomeEmail = false,
  ip = "unknown",
}: CreateUserOptions) {
  // Check for existing user by email (case insensitive)
  const existingUserByEmail = await userRepository.findAll({ where: { email } });
  if (existingUserByEmail) {
    throw new Error("An account with this email already exists");
  }

  // Check for existing username if provided (case insensitive)
  if (username) {
    const existingUserByUsername = await userRepository.findAll({ where: { username } });
    if (existingUserByUsername) {
      throw new Error("This username is already taken");
    }
  }

  const hashedPassword = await argon2.hash(password);

  let emailVerificationToken: string | undefined = undefined;
  let emailVerificationExpires: Date | undefined = undefined;
  let emailVerified: Date | undefined = undefined;

  if (requireEmailVerification) {
    emailVerificationToken = generateRandomToken(32);
    emailVerificationExpires = addHours(new Date(), 24);
  } else {
    emailVerified = new Date();
  }

  const userData: Prisma.UserCreateInput = {
    name,
    email,
    password: hashedPassword,
    role,
    username,
    bio,
    emailVerificationToken,
    emailVerificationExpires,
    emailVerified,
  };

  const user = await userRepository.create(userData);

  logger.info("User created", {
    userId: user.id,
    email: user.email,
    role: user.role,
    ip,
    action: "createUser",
    audit: true,
  });

  // Send email if needed
  if (requireEmailVerification && emailVerificationToken) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${emailVerificationToken}`;
    await sendMailgunEmail({
      to: email,
      subject: "Verify your email address",
      text: `Welcome to RLineCMS! Please verify your email by clicking the following link: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
      html: `
        <h1>Welcome to RLineCMS!</h1>
        <p>Thank you for creating an account. To complete your registration, please verify your email address by clicking the button below:</p>
        <p>
          <a href="${verifyUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  } else if (sendWelcomeEmail) {
    await sendMailgunEmail({
      to: email,
      subject: "Welcome to RLineCMS!",
      text: `Your account has been created by an administrator. You can now log in at: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login`,
      html: `
        <h1>Welcome to RLineCMS!</h1>
        <p>Your account has been created by an administrator. You can now <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login">log in</a>.</p>
      `,
    });
  }

  return user;
} 
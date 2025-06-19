import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "../services/authService";
import { CreateUserRequest, LoginRequest, ApiResponse } from "../types";

export class AuthController {
  static async register(
    req: Request<{}, ApiResponse, CreateUserRequest>,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          data: errors.array(),
        });
        return;
      }

      const user = await AuthService.createUser(req.body);
      const tokens = await AuthService.generateTokens(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.created_at,
          },
          tokens,
        },
        message: "User registered successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      });
    }
  }

  static async login(
    req: Request<{}, ApiResponse, LoginRequest>,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          data: errors.array(),
        });
        return;
      }

      const { email, password } = req.body;
      const user = await AuthService.authenticateUser(email, password);

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Invalid email or password",
        });
        return;
      }

      const tokens = await AuthService.generateTokens(user);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
          tokens,
        },
        message: "Login successful",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  }

  static async validateSession(
    req: Request,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "No user found in request",
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
          valid: true,
        },
        message: "Session is valid",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Session validation failed",
      });
    }
  }

  static async getProfile(
    req: Request,
    res: Response<ApiResponse>,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "No user found in request",
        });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.created_at,
          isActive: user.is_active,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get profile",
      });
    }
  }
}

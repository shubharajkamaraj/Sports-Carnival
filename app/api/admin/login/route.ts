import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    // Validate submitted code
    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Organizer code is required",
        },
        {
          status: 400,
        }
      );
    }

    // Get organizer code from environment
    const organizerCode =
      process.env.ORGANIZER_CODE?.trim();

    if (!organizerCode) {
      console.error(
        "ORGANIZER_CODE is not configured"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Organizer authentication is not configured",
        },
        {
          status: 500,
        }
      );
    }

    // Check code
    if (code !== organizerCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid organizer code",
        },
        {
          status: 401,
        }
      );
    }

    // Successful login
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
      },
      {
        status: 200,
      }
    );

    // Create authentication cookie
    response.cookies.set({
      name: "organizer-auth",
      value: "authenticated",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;

  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}
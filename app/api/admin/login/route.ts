import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const code = body.code;

    if (!code) {
      return NextResponse.json(
        {
          error: "Organizer code is required",
        },
        {
          status: 400,
        }
      );
    }

    const organizerCode =
      process.env.ORGANIZER_CODE;

    if (!organizerCode) {
      console.error(
        "ORGANIZER_CODE is not configured"
      );

      return NextResponse.json(
        {
          error:
            "Organizer authentication is not configured",
        },
        {
          status: 500,
        }
      );
    }

    if (code !== organizerCode) {
      return NextResponse.json(
        {
          error: "Invalid organizer code",
        },
        {
          status: 401,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set(
      "organizer-auth",
      "authenticated",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}
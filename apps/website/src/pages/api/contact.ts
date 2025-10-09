import type { APIRoute } from "astro";
import { sendContactFormEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "請填寫所有必填欄位",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    await sendContactFormEmail({
      name,
      email,
      message,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "您的訊息已成功送出！我們會儘快回覆您。",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Contact form submission error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "發送訊息時發生錯誤，請稍後再試。",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

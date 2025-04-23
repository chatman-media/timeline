import fs from "fs"
import { NextResponse } from "next/server"
import path from "path"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get("path")

    if (!filePath) {
      return new NextResponse("Path is required", { status: 400 })
    }

    // Добавляем префикс public к пути
    const fullPath = path.join(process.cwd(), "public", filePath)

    // Проверяем, что файл существует
    if (!fs.existsSync(fullPath)) {
      console.error("File not found:", fullPath)
      return new NextResponse("File not found", { status: 404 })
    }

    // Читаем файл
    const fileBuffer = fs.readFileSync(fullPath)

    // Определяем MIME тип
    const ext = path.extname(filePath).toLowerCase()
    let contentType = "application/octet-stream"

    if (ext === ".aiff" || ext === ".aif") {
      contentType = "audio/aiff"
    } else if (ext === ".wav") {
      contentType = "audio/wav"
    } else if (ext === ".mp3") {
      contentType = "audio/mpeg"
    }

    // Возвращаем файл
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// "use client"

// import { memo, Suspense, useEffect, useState } from "react"

// import { useRootStore } from "@/hooks/use-root-store"
// import { initializeDatabase } from "@/lib/db-init"

// /**
//  * Этот компонент отвечает за запуск процесса инициализации состояния
//  * при монтировании приложения. Он не блокирует рендеринг дочерних компонентов.
//  */
// export const StateInitializer = memo(function StateInitializer({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const { initializeHistory, fetchVideos } = useRootStore()
//   const [isInitialized, setIsInitialized] = useState(false)
//   const [initAttempted, setInitAttempted] = useState(false)

//   useEffect(() => {
//     // Предотвращаем повторную инициализацию
//     if (initAttempted) return

//     const init = async () => {
//       try {
//         setInitAttempted(true)
//         console.log("[StateInitializer] Starting initialization...")

//         const restoredState = await initializeDatabase()
//         console.log("[StateInitializer] Database initialized", {
//           hasRestoredState: !!restoredState,
//           tracksCount: restoredState?.tracks?.length || 0,
//           mediaCount: restoredState?.media?.length || 0,
//           addedFilesCount: restoredState?.addedFiles?.size || 0,
//         })

//         // Инициализируем историю
//         await initializeHistory()
//         console.log("[StateInitializer] History initialized")

//         // Загружаем видео только если данные не были восстановлены из БД
//         // или если в восстановленном состоянии нет медиафайлов
//         if (!restoredState || !(restoredState.media?.length > 0)) {
//           console.log("[StateInitializer] No restored media found. Calling fetchVideos...")
//           await fetchVideos()
//           console.log("[StateInitializer] Videos fetched")
//         } else {
//           console.log(
//             "[StateInitializer] Restored media found:",
//             restoredState.media.length,
//             "files. Skipping fetchVideos.",
//           )
//         }

//         setIsInitialized(true)
//       } catch (error) {
//         console.error("[StateInitializer] Initialization failed:", error)
//         // В случае ошибки все равно помечаем как инициализированное,
//         // чтобы приложение могло продолжить работу
//         setIsInitialized(true)
//       }
//     }

//     init()
//   }, [initializeHistory, fetchVideos, initAttempted])

//   return (
//     <Suspense fallback={null}>
//       {isInitialized ? (
//         <>
//           {console.log("[StateInitializer] Rendering children...")}
//           {children}
//         </>
//       ) : null}
//     </Suspense>
//   )
// })
